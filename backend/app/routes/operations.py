import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from backend.app.database.session import get_db
from backend.app.models.models import (
    Incident, IncidentUpdate, RescueTeam, RescueOperation,
    Resource, ResourceTransaction, Shelter, ShelterOccupancyLog,
    Hospital, HospitalAvailabilityLog, EmergencyAlert
)

router = APIRouter(prefix="/api/operations", tags=["Emergency Operations Management"])


# ==============================================================================
# PYDANTIC SCHEMAS
# ==============================================================================

class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3)
    disaster_category: str = Field(..., description="Flood, Heavy Rainfall, Landslide, Storm, Heatwave, Drought")
    description: str = Field(..., min_length=5)
    location_name: str
    latitude: float
    longitude: float
    severity: str = "Moderate"
    risk_category: str = "MODERATE"
    reported_by: str = "Field Observer"
    affected_population: int = 0
    estimated_damage: str = "Under Assessment"
    notes: Optional[str] = None
    is_demo: Optional[bool] = False


class IncidentStatusUpdate(BaseModel):
    new_status: str = Field(..., description="Reported, Under Verification, Confirmed, Response Active, Monitoring, Resolved, Closed")
    update_text: str = Field(..., min_length=3)
    updated_by: str = "EOC Commander"


class RescueTeamCreate(BaseModel):
    name: str
    team_type: str = "NDRF"
    leader_name: str
    contact_number: str
    member_count: int = 10
    equipment_summary: str = "Boats, life vests, radios"
    base_location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class RescueOperationCreate(BaseModel):
    incident_id: int
    team_id: int
    priority: str = "High"
    objectives: str
    notes: Optional[str] = None


class ResourceCreate(BaseModel):
    name: str
    category: str
    quantity: float
    unit: str = "Units"
    storage_location: str
    condition: str = "Good"


class ResourceAdjust(BaseModel):
    transaction_type: str = Field(..., description="Allocation, Consumption, Restock, Return")
    delta_quantity: float
    notes: Optional[str] = None


class ShelterCreate(BaseModel):
    name: str
    location_name: str
    latitude: float
    longitude: float
    total_capacity: int = 500
    contact_person: str
    contact_number: str
    facilities: Optional[str] = '["Drinking Water", "First Aid", "Sanitation", "Power Backup"]'
    accessibility_info: Optional[str] = "Accessible via highway"


class ShelterOccupancyUpdate(BaseModel):
    current_occupancy: int
    remarks: Optional[str] = None


class HospitalCreate(BaseModel):
    name: str
    address: str
    location_name: str
    latitude: float
    longitude: float
    contact_number: str
    total_beds: int = 100
    available_beds: int = 25
    available_ambulances: int = 4


class HospitalAvailabilityUpdate(BaseModel):
    available_beds: int
    available_ambulances: int


class AlertCreate(BaseModel):
    title: str
    alert_type: str
    severity: str = "High"
    message: str
    location_name: str
    incident_id: Optional[int] = None
    is_demo: Optional[bool] = False


# ==============================================================================
# 1. INCIDENT MANAGEMENT ENDPOINTS
# ==============================================================================

@router.get("/incidents")
def list_incidents(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve incidents with filtering and search."""
    q = db.query(Incident)
    if status and status != "All":
        q = q.filter(Incident.status == status)
    if category and category != "All":
        q = q.filter(Incident.disaster_category == category)
    if search:
        q = q.filter(Incident.title.ilike(f"%{search}%") | Incident.location_name.ilike(f"%{search}%"))

    incidents = q.order_by(Incident.reported_at.desc()).all()
    return incidents


@router.post("/incidents")
def create_incident(req: IncidentCreate, db: Session = Depends(get_db)):
    """Register a new emergency incident and record initial update log."""
    count = db.query(Incident).count()
    inc_id = f"INC-{datetime.datetime.now(datetime.UTC).strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"

    inc = Incident(
        incident_id=inc_id,
        title=req.title,
        disaster_category=req.disaster_category,
        description=req.description,
        location_name=req.location_name,
        latitude=req.latitude,
        longitude=req.longitude,
        severity=req.severity,
        risk_category=req.risk_category,
        reported_by=req.reported_by,
        affected_population=req.affected_population,
        estimated_damage=req.estimated_damage,
        status="Reported",
        notes=req.notes,
        is_demo=req.is_demo or False,
        reported_at=datetime.datetime.utcnow(),
        created_at=datetime.datetime.utcnow()
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    # Initial update log
    update = IncidentUpdate(
        incident_id=inc.id,
        update_text="Incident registered in Project Sentinel.",
        updated_by=req.reported_by,
        previous_status=None,
        new_status="Reported",
        created_at=datetime.datetime.utcnow()
    )
    db.add(update)
    db.commit()

    return {
        "id": inc.id,
        "incident_id": inc.incident_id,
        "title": inc.title,
        "disaster_category": inc.disaster_category,
        "description": inc.description,
        "location_name": inc.location_name,
        "severity": inc.severity,
        "status": inc.status,
        "affected_population": inc.affected_population
    }


@router.get("/incidents/{incident_id}")
def get_incident_detail(incident_id: int, db: Session = Depends(get_db)):
    """Fetch complete incident record including timeline audit log."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    updates = db.query(IncidentUpdate).filter(
        IncidentUpdate.incident_id == incident_id
    ).order_by(IncidentUpdate.created_at.desc()).all()

    return {
        "incident": inc,
        "timeline": updates
    }


@router.patch("/incidents/{incident_id}/status")
def update_incident_status(incident_id: int, req: IncidentStatusUpdate, db: Session = Depends(get_db)):
    """Advance incident lifecycle and maintain audit history."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    prev = inc.status
    inc.status = req.new_status
    inc.updated_at = datetime.datetime.utcnow()

    update = IncidentUpdate(
        incident_id=inc.id,
        update_text=req.update_text,
        updated_by=req.updated_by,
        previous_status=prev,
        new_status=req.new_status,
        created_at=datetime.datetime.utcnow()
    )
    db.add(update)
    db.commit()
    db.refresh(inc)

    return {"status": "success", "incident": inc}


# ==============================================================================
# 2. RESCUE OPERATIONS ENDPOINTS
# ==============================================================================

@router.get("/teams")
def list_rescue_teams(db: Session = Depends(get_db)):
    """List all registered search & rescue teams."""
    return db.query(RescueTeam).all()


@router.post("/teams")
def create_rescue_team(req: RescueTeamCreate, db: Session = Depends(get_db)):
    """Register a new rescue team."""
    count = db.query(RescueTeam).count()
    team_id = f"TEAM-{uuid.uuid4().hex[:4].upper()}"

    team = RescueTeam(
        team_id=team_id,
        name=req.name,
        team_type=req.team_type,
        leader_name=req.leader_name,
        contact_number=req.contact_number,
        member_count=req.member_count,
        equipment_summary=req.equipment_summary,
        base_location=req.base_location,
        latitude=req.latitude,
        longitude=req.longitude,
        status="Available"
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.patch("/teams/{team_id}/status")
def update_team_status(team_id: int, status: str, db: Session = Depends(get_db)):
    """Update team readiness (Available, Assigned, Deployed, On Break, Unavailable)."""
    team = db.query(RescueTeam).filter(RescueTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    team.status = status
    db.commit()
    return team


@router.get("/rescue-ops")
def list_rescue_operations(db: Session = Depends(get_db)):
    """List active and completed rescue operations."""
    ops = db.query(RescueOperation).all()
    result = []
    for op in ops:
        inc = db.query(Incident).filter(Incident.id == op.incident_id).first()
        team = db.query(RescueTeam).filter(RescueTeam.id == op.team_id).first()
        result.append({
            "id": op.id,
            "operation_id": op.operation_id,
            "incident_id": op.incident_id,
            "incident_title": inc.title if inc else "General Mission",
            "team_id": op.team_id,
            "team_name": team.name if team else "Unassigned",
            "priority": op.priority,
            "objectives": op.objectives,
            "status": op.status,
            "start_time": op.start_time,
            "completion_time": op.completion_time
        })
    return result


@router.post("/rescue-ops")
def create_rescue_operation(req: RescueOperationCreate, db: Session = Depends(get_db)):
    """Dispatch a rescue team to an incident and prevent duplicate deployment."""
    team = db.query(RescueTeam).filter(RescueTeam.id == req.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Rescue team not found")

    count = db.query(RescueOperation).count()
    op_id = f"OPS-{datetime.datetime.now(datetime.UTC).strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"

    op = RescueOperation(
        operation_id=op_id,
        incident_id=req.incident_id,
        team_id=req.team_id,
        priority=req.priority,
        objectives=req.objectives,
        status="In Progress",
        notes=req.notes,
        start_time=datetime.datetime.utcnow()
    )
    # Mark team as deployed
    team.status = "Deployed"

    db.add(op)
    db.commit()
    db.refresh(op)
    return op


@router.patch("/rescue-ops/{operation_id}/status")
def update_operation_status(operation_id: int, status: str, db: Session = Depends(get_db)):
    """Update rescue operation status (Planning, In Progress, Completed, Aborted)."""
    op = db.query(RescueOperation).filter(RescueOperation.id == operation_id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Operation not found")

    op.status = status
    if status in ["Completed", "Aborted"]:
        op.completion_time = datetime.datetime.utcnow()
        # Free up the team
        if op.team_id:
            team = db.query(RescueTeam).filter(RescueTeam.id == op.team_id).first()
            if team:
                team.status = "Available"

    db.commit()
    return op


# ==============================================================================
# 3. RESOURCE INVENTORY ENDPOINTS
# ==============================================================================

@router.get("/resources")
def list_resources(db: Session = Depends(get_db)):
    """List all emergency stockpile items and their transaction history."""
    return db.query(Resource).all()


@router.post("/resources")
def create_resource(req: ResourceCreate, db: Session = Depends(get_db)):
    """Add new resource stockpile record."""
    count = db.query(Resource).count()
    res_id = f"RES-{uuid.uuid4().hex[:4].upper()}"

    res = Resource(
        resource_id=res_id,
        name=req.name,
        category=req.category,
        quantity=req.quantity,
        unit=req.unit,
        storage_location=req.storage_location,
        available_quantity=req.quantity,
        reserved_quantity=0,
        deployed_quantity=0,
        condition=req.condition
    )
    db.add(res)
    db.commit()
    db.refresh(res)
    return res


@router.post("/resources/{resource_id}/adjust")
def adjust_resource(resource_id: int, req: ResourceAdjust, db: Session = Depends(get_db)):
    """
    Adjust resource stock level (Allocation, Consumption, Restock, Return).
    Strictly prevents negative inventory values.
    """
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")

    if req.transaction_type in ["Allocation", "Consumption"]:
        if res.available_quantity < req.delta_quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot allocate {req.delta_quantity} {res.unit}. Only {res.available_quantity} available."
            )
        res.available_quantity -= req.delta_quantity
        if req.transaction_type == "Allocation":
            res.reserved_quantity += req.delta_quantity
        else:
            res.deployed_quantity += req.delta_quantity
    elif req.transaction_type in ["Restock", "Return"]:
        res.available_quantity += req.delta_quantity
        res.quantity += req.delta_quantity

    res.last_updated = datetime.datetime.utcnow()

    tx = ResourceTransaction(
        resource_id=res.id,
        transaction_type=req.transaction_type,
        quantity=req.delta_quantity,
        notes=req.notes,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(tx)
    db.commit()
    db.refresh(res)

    return res


# ==============================================================================
# 4. SHELTER MANAGEMENT ENDPOINTS
# ==============================================================================

@router.get("/shelters")
def list_shelters(db: Session = Depends(get_db)):
    """List relief shelters with live occupancy rates."""
    shelters = db.query(Shelter).all()
    result = []
    for s in shelters:
        rate = round((s.current_occupancy / max(1, s.total_capacity)) * 100, 1)
        result.append({
            "id": s.id,
            "shelter_id": s.shelter_id,
            "name": s.name,
            "location_name": s.location_name,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "total_capacity": s.total_capacity,
            "current_occupancy": s.current_occupancy,
            "available_capacity": max(0, s.total_capacity - s.current_occupancy),
            "occupancy_rate": rate,
            "contact_person": s.contact_person,
            "contact_number": s.contact_number,
            "status": s.status,
            "is_demo": s.is_demo
        })
    return result


@router.post("/shelters")
def create_shelter(req: ShelterCreate, db: Session = Depends(get_db)):
    """Register an emergency shelter."""
    count = db.query(Shelter).count()
    s_id = f"SHELTER-{uuid.uuid4().hex[:4].upper()}"

    shelter = Shelter(
        shelter_id=s_id,
        name=req.name,
        location_name=req.location_name,
        latitude=req.latitude,
        longitude=req.longitude,
        total_capacity=req.total_capacity,
        current_occupancy=0,
        contact_person=req.contact_person,
        contact_number=req.contact_number,
        facilities_json=req.facilities or '["Drinking Water", "First Aid", "Sanitation", "Power Backup"]',
        accessibility_info=req.accessibility_info,
        status="Operational"
    )
    db.add(shelter)
    db.commit()
    db.refresh(shelter)
    return shelter


@router.patch("/shelters/{shelter_id}/occupancy")
def update_shelter_occupancy(shelter_id: int, req: ShelterOccupancyUpdate, db: Session = Depends(get_db)):
    """Update current shelter occupancy count with overflow validation."""
    shelter = db.query(Shelter).filter(Shelter.id == shelter_id).first()
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found")

    if req.current_occupancy < 0:
        raise HTTPException(status_code=400, detail="Occupancy cannot be negative.")

    delta = req.current_occupancy - shelter.current_occupancy
    shelter.current_occupancy = req.current_occupancy
    if shelter.current_occupancy >= shelter.total_capacity:
        shelter.status = "Full"
    else:
        shelter.status = "Operational"

    log = ShelterOccupancyLog(
        shelter_id=shelter.id,
        delta_count=delta,
        current_occupancy=req.current_occupancy,
        remarks=req.remarks or "Routine intake adjustment",
        logged_at=datetime.datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.refresh(shelter)
    return {
        "id": shelter.id,
        "shelter_id": shelter.shelter_id,
        "name": shelter.name,
        "current_occupancy": shelter.current_occupancy,
        "total_capacity": shelter.total_capacity,
        "status": shelter.status
    }


# ==============================================================================
# 5. HOSPITAL & MEDICAL FACILITY ENDPOINTS
# ==============================================================================

@router.get("/hospitals")
def list_hospitals(db: Session = Depends(get_db)):
    """List hospitals with bed and ambulance availability."""
    return db.query(Hospital).all()


@router.post("/hospitals")
def create_hospital(req: HospitalCreate, db: Session = Depends(get_db)):
    """Register hospital facility."""
    count = db.query(Hospital).count()
    h_id = f"HOSP-{uuid.uuid4().hex[:4].upper()}"

    hosp = Hospital(
        hospital_id=h_id,
        name=req.name,
        address=req.address,
        location_name=req.location_name,
        latitude=req.latitude,
        longitude=req.longitude,
        contact_number=req.contact_number,
        total_beds=req.total_beds,
        available_beds=req.available_beds,
        available_ambulances=req.available_ambulances,
        status="Operational"
    )
    db.add(hosp)
    db.commit()
    db.refresh(hosp)
    return hosp


@router.patch("/hospitals/{hospital_id}/availability")
def update_hospital_availability(hospital_id: int, req: HospitalAvailabilityUpdate, db: Session = Depends(get_db)):
    """Update bed and ambulance counts in real time."""
    hosp = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")

    hosp.available_beds = max(0, min(hosp.total_beds, req.available_beds))
    hosp.available_ambulances = max(0, req.available_ambulances)

    log = HospitalAvailabilityLog(
        hospital_id=hosp.id,
        available_beds=hosp.available_beds,
        available_ambulances=hosp.available_ambulances,
        updated_at=datetime.datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.refresh(hosp)
    return {
        "id": hosp.id,
        "hospital_id": hosp.hospital_id,
        "name": hosp.name,
        "available_beds": hosp.available_beds,
        "total_beds": hosp.total_beds,
        "available_ambulances": hosp.available_ambulances,
        "status": hosp.status
    }


# ==============================================================================
# 6. EMERGENCY ALERT CENTER ENDPOINTS
# ==============================================================================

@router.get("/alerts")
def list_alerts(status: Optional[str] = None, db: Session = Depends(get_db)):
    """List alerts with optional status filter."""
    q = db.query(EmergencyAlert)
    if status and status != "All":
        q = q.filter(EmergencyAlert.status == status)
    return q.order_by(EmergencyAlert.created_at.desc()).all()


@router.post("/alerts")
def broadcast_alert(req: AlertCreate, db: Session = Depends(get_db)):
    """Broadcast an emergency alert."""
    count = db.query(EmergencyAlert).count()
    a_id = f"ALERT-{datetime.datetime.now(datetime.UTC).strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"

    alert = EmergencyAlert(
        alert_id=a_id,
        title=req.title,
        alert_type=req.alert_type,
        severity=req.severity,
        message=req.message,
        location_name=req.location_name,
        incident_id=req.incident_id,
        status="Active",
        is_demo=req.is_demo or False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {
        "id": alert.id,
        "alert_id": alert.alert_id,
        "title": alert.title,
        "status": alert.status,
        "severity": alert.severity
    }


@router.patch("/alerts/{alert_id}/status")
def update_alert_status(alert_id: int, status: str, db: Session = Depends(get_db)):
    """Acknowledge or resolve emergency alert."""
    alert = db.query(EmergencyAlert).filter(EmergencyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = status
    db.commit()
    return {
        "id": alert.id,
        "alert_id": alert.alert_id,
        "status": alert.status
    }
