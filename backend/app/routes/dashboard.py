from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from backend.app.database.session import get_db
from backend.app.models.models import (
    Incident, DisasterAssessment, RescueTeam,
    Resource, Shelter, Hospital, EmergencyAlert,
    RecoveryProject, ApplicationSetting
)
from backend.app.services.demo_data import load_demo_data, clear_demo_data

router = APIRouter(prefix="/api/dashboard", tags=["Command Center"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Calculate and return live operational statistics straight from SQLite database."""
    total_incidents = db.query(Incident).count()
    active_emergencies = db.query(Incident).filter(
        Incident.status.in_(["Reported", "Under Verification", "Confirmed", "Response Active"])
    ).count()

    critical_locations = db.query(DisasterAssessment).filter(
        DisasterAssessment.risk_category.in_(["CRITICAL", "Critical"])
    ).count()
    high_risk_locations = db.query(DisasterAssessment).filter(
        DisasterAssessment.risk_category.in_(["HIGH", "High", "VERY HIGH"])
    ).count()

    available_teams = db.query(RescueTeam).filter(RescueTeam.status == "Available").count()
    deployed_teams = db.query(RescueTeam).filter(RescueTeam.status == "Deployed").count()

    # Shelter metrics
    shelters = db.query(Shelter).all()
    total_shelters = len(shelters)
    total_capacity = sum(s.total_capacity for s in shelters)
    current_occupancy = sum(s.current_occupancy for s in shelters)
    available_shelter_capacity = max(0, total_capacity - current_occupancy)

    # Hospital metrics
    hospitals = db.query(Hospital).all()
    total_hospitals = len(hospitals)
    total_beds = sum(h.total_beds for h in hospitals)
    available_beds = sum(h.available_beds for h in hospitals)
    available_ambulances = sum(h.available_ambulances for h in hospitals)

    # Resource metrics
    resources = db.query(Resource).all()
    total_resources_items = len(resources)
    total_available_supplies = sum(r.available_quantity for r in resources)

    # Alerts metrics
    active_alerts = db.query(EmergencyAlert).filter(EmergencyAlert.status == "Active").count()
    critical_alerts = db.query(EmergencyAlert).filter(
        EmergencyAlert.status == "Active",
        EmergencyAlert.severity.in_(["Critical", "High"])
    ).count()

    # Recovery metrics
    recovery_projects = db.query(RecoveryProject).count()

    demo_setting = db.query(ApplicationSetting).filter(ApplicationSetting.setting_key == "demo_mode_loaded").first()
    is_demo = demo_setting.setting_value.lower() == "true" if demo_setting else False

    return {
        "total_incidents": total_incidents,
        "active_emergencies": active_emergencies,
        "critical_risk_locations": critical_locations,
        "high_risk_locations": high_risk_locations,
        "available_rescue_teams": available_teams,
        "deployed_rescue_teams": deployed_teams,
        "total_shelters": total_shelters,
        "total_shelter_capacity": total_capacity,
        "current_shelter_occupancy": current_occupancy,
        "available_shelter_capacity": available_shelter_capacity,
        "total_hospitals": total_hospitals,
        "total_beds": total_beds,
        "available_hospital_beds": available_beds,
        "available_ambulances": available_ambulances,
        "total_resources_items": total_resources_items,
        "total_available_supplies": total_available_supplies,
        "active_alerts_count": active_alerts,
        "critical_alerts_count": critical_alerts,
        "recovery_projects_count": recovery_projects,
        "is_demo_loaded": is_demo
    }


@router.get("/charts")
def get_dashboard_charts(db: Session = Depends(get_db)):
    """Return aggregated data formatted specifically for Recharts visualizations."""
    # 1. Incidents by Category
    category_rows = db.query(
        Incident.disaster_category, func.count(Incident.id)
    ).group_by(Incident.disaster_category).all()
    incidents_by_category = [
        {"category": row[0], "count": row[1]} for row in category_rows
    ]

    # 2. Incidents by Severity
    severity_rows = db.query(
        Incident.severity, func.count(Incident.id)
    ).group_by(Incident.severity).all()
    incidents_by_severity = [
        {"severity": row[0], "count": row[1]} for row in severity_rows
    ]

    # 3. Rescue Team Status Distribution
    team_rows = db.query(
        RescueTeam.status, func.count(RescueTeam.id)
    ).group_by(RescueTeam.status).all()
    rescue_teams_by_status = [
        {"status": row[0], "count": row[1]} for row in team_rows
    ]

    # 4. Shelter Occupancy Overview
    shelter_data = []
    for s in db.query(Shelter).limit(6).all():
        shelter_data.append({
            "name": s.name.replace("[DEMO] ", "")[:18] + "...",
            "capacity": s.total_capacity,
            "occupancy": s.current_occupancy,
            "available": max(0, s.total_capacity - s.current_occupancy),
            "occupancy_rate": round((s.current_occupancy / max(1, s.total_capacity)) * 100, 1)
        })

    # 5. Hospital Availability
    hospital_data = []
    for h in db.query(Hospital).limit(6).all():
        hospital_data.append({
            "name": h.name.replace("[DEMO] ", "")[:18] + "...",
            "total_beds": h.total_beds,
            "available_beds": h.available_beds,
            "ambulances": h.available_ambulances
        })

    # 6. Resource Overview by Category
    res_rows = db.query(
        Resource.category,
        func.sum(Resource.quantity),
        func.sum(Resource.available_quantity)
    ).group_by(Resource.category).all()
    resource_data = [
        {
            "category": row[0],
            "total": float(row[1] or 0),
            "available": float(row[2] or 0)
        }
        for row in res_rows
    ]

    return {
        "incidents_by_category": incidents_by_category,
        "incidents_by_severity": incidents_by_severity,
        "rescue_teams_by_status": rescue_teams_by_status,
        "shelters": shelter_data,
        "hospitals": hospital_data,
        "resources": resource_data
    }


@router.get("/recent-incidents")
def get_recent_incidents(limit: int = 5, db: Session = Depends(get_db)):
    """Fetch most recently logged emergency incidents."""
    incidents = db.query(Incident).order_by(Incident.reported_at.desc()).limit(limit).all()
    return [
        {
            "id": inc.id,
            "incident_id": inc.incident_id,
            "title": inc.title,
            "category": inc.disaster_category,
            "location": inc.location_name,
            "severity": inc.severity,
            "status": inc.status,
            "reported_at": inc.reported_at,
            "affected_population": inc.affected_population,
            "is_demo": inc.is_demo
        }
        for inc in incidents
    ]


@router.get("/alerts")
def get_dashboard_alerts(limit: int = 5, db: Session = Depends(get_db)):
    """Fetch active emergency alerts."""
    alerts = db.query(EmergencyAlert).filter(
        EmergencyAlert.status == "Active"
    ).order_by(EmergencyAlert.created_at.desc()).limit(limit).all()
    return [
        {
            "id": a.id,
            "alert_id": a.alert_id,
            "title": a.title,
            "type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "location": a.location_name,
            "created_at": a.created_at,
            "is_demo": a.is_demo
        }
        for a in alerts
    ]


@router.post("/demo/load")
def load_demo(db: Session = Depends(get_db)):
    """Load fictional Bihar flood disaster demonstration scenario."""
    return load_demo_data(db)


@router.post("/demo/clear")
def clear_demo(db: Session = Depends(get_db)):
    """Clear fictional Bihar flood demonstration scenario."""
    return clear_demo_data(db)

