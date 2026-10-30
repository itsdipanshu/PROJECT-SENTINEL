import json
import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional

from backend.app.database.session import get_db
from backend.app.models.models import Report
from backend.app.services.report_generator import (
    build_sitrep, build_resource_report, build_recovery_report
)

router = APIRouter(prefix="/api/reports", tags=["Reports & Documentation"])


class ReportGenerateRequest(BaseModel):
    report_type: str = Field(..., description="Situation, Resource, Recovery")
    file_format: str = Field("PDF", description="PDF, CSV")
    generated_by: Optional[str] = "Sentinel EOC Operator"


@router.get("/list")
def list_reports(db: Session = Depends(get_db)):
    """List all generated disaster intelligence reports."""
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    result = []
    for r in reports:
        try:
            summary = json.loads(r.parameters_json) if r.parameters_json else {}
        except Exception:
            summary = {}
        result.append({
            "id": r.id,
            "report_id": r.report_id,
            "title": r.title,
            "report_type": r.report_type,
            "file_format": r.file_format,
            "file_name": Path(r.file_path).name if r.file_path else "",
            "generated_by": r.generated_by,
            "summary": summary,
            "created_at": r.created_at
        })
    return result


@router.post("/generate")
def generate_report(req: ReportGenerateRequest, db: Session = Depends(get_db)):
    """Generate a disaster report in PDF or CSV format from live database."""
    fmt = req.file_format.upper()
    rtype = req.report_type.strip().lower()

    if "sitrep" in rtype or "situation" in rtype:
        report_data = build_sitrep(db, file_format=fmt)
    elif "resource" in rtype or "stock" in rtype:
        report_data = build_resource_report(db, file_format=fmt)
    elif "recovery" in rtype or "reconstruction" in rtype:
        report_data = build_recovery_report(db, file_format=fmt)
    else:
        report_data = build_sitrep(db, file_format=fmt)

    count = db.query(Report).count()
    rep_id = f"REP-{datetime.datetime.utcnow().strftime('%Y%m')}-{count + 1:04d}"

    rep = Report(
        report_id=rep_id,
        title=report_data["title"],
        report_type=report_data["report_type"],
        file_path=report_data["file_path"],
        file_format=report_data["file_format"],
        parameters_json=json.dumps(report_data["summary"]),
        generated_by=req.generated_by or "Sentinel Operator",
        created_at=datetime.datetime.utcnow()
    )
    db.add(rep)
    db.commit()
    db.refresh(rep)

    return {
        "status": "success",
        "id": rep.id,
        "report_id": rep.report_id,
        "title": rep.title,
        "file_format": rep.file_format,
        "file_name": report_data["file_name"],
        "download_url": f"/api/reports/download/{rep.id}"
    }


@router.get("/download/{report_id}")
def download_report(report_id: int, db: Session = Depends(get_db)):
    """Download the generated report file."""
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep or not rep.file_path:
        raise HTTPException(status_code=404, detail="Report file not found")

    file_path = Path(rep.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File on disk has been purged or moved")

    media_type = "application/pdf" if rep.file_format == "PDF" else "text/csv"
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name
    )

