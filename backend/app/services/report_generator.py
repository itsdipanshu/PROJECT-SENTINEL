import csv
import json
import datetime
from pathlib import Path
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from backend.app.core.config import settings
from backend.app.models.models import (
    Incident, Shelter, Hospital, Resource, RecoveryProject, Report
)


def generate_pdf_report(
    title: str,
    report_type: str,
    headers: List[str],
    rows: List[List[Any]],
    summary_stats: Dict[str, Any],
    file_name: str
) -> Path:
    """Generate professional Project Sentinel disaster intelligence PDF report."""
    output_path = settings.REPORTS_DIR / file_name

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#0284c7'),
        spaceAfter=12
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        textColor=colors.HexColor('#475569')
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        textColor=colors.HexColor('#1e293b')
    )
    disclaimer_style = ParagraphStyle(
        'DocDisclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        textColor=colors.HexColor('#94a3b8')
    )

    story = []

    # 1. Header & Branding
    story.append(Paragraph("PROJECT SENTINEL – EMERGENCY OPERATIONS NETWORK", subtitle_style))
    story.append(Paragraph(title.upper(), title_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=10))

    # 2. Metadata block
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    meta_text = f"<b>Generated:</b> {now_str} &nbsp;|&nbsp; <b>Report Type:</b> {report_type} &nbsp;|&nbsp; <b>Classification:</b> OFFICIAL EOC RECORD"
    story.append(Paragraph(meta_text, meta_style))
    story.append(Spacer(1, 12))

    # 3. Summary Statistics Table
    if summary_stats:
        stat_data = [
            [Paragraph(f"<b>{k}</b>", meta_style), Paragraph(str(v), body_style)]
            for k, v in summary_stats.items()
        ]
        stat_table = Table(stat_data, colWidths=[200, 320])
        stat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(stat_table)
        story.append(Spacer(1, 14))

    # 4. Main Data Table
    table_data = [[Paragraph(f"<b>{h}</b>", meta_style) for h in headers]]
    for row in rows:
        table_data.append([Paragraph(str(cell), body_style) for cell in row])

    col_width = 520 / max(1, len(headers))
    data_table = Table(table_data, colWidths=[col_width] * len(headers))
    data_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(data_table)
    story.append(Spacer(1, 18))

    # 5. Disclaimer & Signature
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceAfter=8))
    story.append(Paragraph(
        "CONFIDENTIALITY & USE: Generated locally by Project Sentinel Disaster Intelligence Platform. "
        "All figures reflect verified database entries at time of compilation. Dissemination restricted to authorized disaster relief personnel.",
        disclaimer_style
    ))

    doc.build(story)
    return output_path


def generate_csv_report(headers: List[str], rows: List[List[Any]], file_name: str) -> Path:
    """Generate CSV disaster intelligence data export."""
    output_path = settings.REPORTS_DIR / file_name
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    return output_path


def build_sitrep(db: Session, file_format: str = "PDF") -> Dict[str, Any]:
    """Compile Daily Disaster Situation Report (SITREP) from live database."""
    incidents = db.query(Incident).all()
    shelters = db.query(Shelter).all()
    hospitals = db.query(Hospital).all()

    total_inc = len(incidents)
    active_inc = sum(1 for i in incidents if i.status in ["Reported", "Confirmed", "Response Active"])
    total_occupancy = sum(s.current_occupancy for s in shelters)
    available_beds = sum(h.available_beds for h in hospitals)

    headers = ["Incident ID", "Category", "Location", "Severity", "Affected Pop.", "Status"]
    rows = [
        [i.incident_id, i.disaster_category, i.location_name, i.severity, f"~{i.affected_population:,}", i.status]
        for i in incidents
    ]

    summary_stats = {
        "Total Incidents Logged": total_inc,
        "Active Emergencies": active_inc,
        "Total Citizens Sheltered": f"{total_occupancy:,}",
        "Hospital Beds Available": available_beds,
        "Operational Status": "Elevated Response Active"
    }

    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    title = "Daily Disaster Situation Report (SITREP)"

    if file_format.upper() == "PDF":
        filename = f"SITREP_{timestamp}.pdf"
        file_path = generate_pdf_report(title, "SITREP", headers, rows, summary_stats, filename)
    else:
        filename = f"SITREP_{timestamp}.csv"
        file_path = generate_csv_report(headers, rows, filename)

    return {
        "title": title,
        "report_type": "Situation",
        "file_path": str(file_path),
        "file_name": filename,
        "file_format": file_format.upper(),
        "summary": summary_stats
    }


def build_resource_report(db: Session, file_format: str = "PDF") -> Dict[str, Any]:
    """Compile Emergency Resource Stockpile Report."""
    resources = db.query(Resource).all()

    headers = ["Resource ID", "Supply Name", "Category", "Available", "Deployed", "Storage Depot"]
    rows = [
        [r.resource_id, r.name, r.category, f"{r.available_quantity} {r.unit}", f"{r.deployed_quantity} {r.unit}", r.storage_location]
        for r in resources
    ]

    summary_stats = {
        "Total Stockpile Types": len(resources),
        "Total Available Inventory": f"{sum(r.available_quantity for r in resources):,.0f} units",
        "Supplies Deployed in Field": f"{sum(r.deployed_quantity for r in resources):,.0f} units"
    }

    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    title = "Emergency Resource Stockpile & Logistics Report"

    if file_format.upper() == "PDF":
        filename = f"RESOURCES_{timestamp}.pdf"
        file_path = generate_pdf_report(title, "Resource", headers, rows, summary_stats, filename)
    else:
        filename = f"RESOURCES_{timestamp}.csv"
        file_path = generate_csv_report(headers, rows, filename)

    return {
        "title": title,
        "report_type": "Resource",
        "file_path": str(file_path),
        "file_name": filename,
        "file_format": file_format.upper(),
        "summary": summary_stats
    }


def build_recovery_report(db: Session, file_format: str = "PDF") -> Dict[str, Any]:
    """Compile Post-Disaster Infrastructure Recovery Report."""
    projects = db.query(RecoveryProject).all()

    headers = ["Project ID", "Infrastructure Title", "Location", "Est. Budget", "Actual Spent", "Progress %", "Status"]
    rows = [
        [p.project_id, p.title, p.location_name, f"INR {p.estimated_cost:,.0f}", f"INR {p.actual_expenditure:,.0f}", f"{p.progress_percent}%", p.status]
        for p in projects
    ]

    summary_stats = {
        "Active Reconstruction Projects": len(projects),
        "Total Estimated Cost": f"INR {sum(p.estimated_cost for p in projects):,.0f}",
        "Total Expenditure to Date": f"INR {sum(p.actual_expenditure for p in projects):,.0f}",
        "Average Progress Rate": f"{round(sum(p.progress_percent for p in projects) / max(1, len(projects)), 1)}%"
    }

    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    title = "Post-Disaster Infrastructure Recovery Report"

    if file_format.upper() == "PDF":
        filename = f"RECOVERY_{timestamp}.pdf"
        file_path = generate_pdf_report(title, "Recovery", headers, rows, summary_stats, filename)
    else:
        filename = f"RECOVERY_{timestamp}.csv"
        file_path = generate_csv_report(headers, rows, filename)

    return {
        "title": title,
        "report_type": "Recovery",
        "file_path": str(file_path),
        "file_name": filename,
        "file_format": file_format.upper(),
        "summary": summary_stats
    }

