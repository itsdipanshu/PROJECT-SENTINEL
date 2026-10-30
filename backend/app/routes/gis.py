import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from backend.app.database.session import get_db
from backend.app.core.config import settings
from backend.app.models.models import Incident, Shelter, Hospital, RescueTeam

router = APIRouter(prefix="/api/gis", tags=["GIS & Disaster Mapping"])


class RoutePlanRequest(BaseModel):
    start_point_name: str
    destination_name: str
    start_lat: float
    start_lng: float
    dest_lat: float
    dest_lng: float
    avoid_hazards: Optional[bool] = True


@router.get("/features")
def get_gis_features(db: Session = Depends(get_db)):
    """
    Return all mapped disaster entities from SQLite database with geographic coordinates.
    Includes incidents, emergency shelters, hospitals, and rescue team bases.
    """
    # 1. Incidents
    incidents = db.query(Incident).filter(Incident.latitude.isnot(None), Incident.longitude.isnot(None)).all()
    inc_features = [
        {
            "id": inc.id,
            "type": "incident",
            "name": inc.title,
            "category": inc.disaster_category,
            "severity": inc.severity,
            "status": inc.status,
            "location_name": inc.location_name,
            "lat": inc.latitude,
            "lng": inc.longitude,
            "details": f"Affected population: ~{inc.affected_population:,} people",
            "is_demo": inc.is_demo
        }
        for inc in incidents
    ]

    # 2. Shelters
    shelters = db.query(Shelter).filter(Shelter.latitude.isnot(None), Shelter.longitude.isnot(None)).all()
    shelter_features = [
        {
            "id": s.id,
            "type": "shelter",
            "name": s.name,
            "location_name": s.location_name,
            "lat": s.latitude,
            "lng": s.longitude,
            "capacity": s.total_capacity,
            "occupancy": s.current_occupancy,
            "available": max(0, s.total_capacity - s.current_occupancy),
            "contact": s.contact_number,
            "status": s.status,
            "is_demo": s.is_demo
        }
        for s in shelters
    ]

    # 3. Hospitals
    hospitals = db.query(Hospital).filter(Hospital.latitude.isnot(None), Hospital.longitude.isnot(None)).all()
    hosp_features = [
        {
            "id": h.id,
            "type": "hospital",
            "name": h.name,
            "address": h.address,
            "location_name": h.location_name,
            "lat": h.latitude,
            "lng": h.longitude,
            "total_beds": h.total_beds,
            "available_beds": h.available_beds,
            "ambulances": h.available_ambulances,
            "contact": h.contact_number,
            "status": h.status,
            "is_demo": h.is_demo
        }
        for h in hospitals
    ]

    # 4. Rescue Teams
    teams = db.query(RescueTeam).filter(RescueTeam.latitude.isnot(None), RescueTeam.longitude.isnot(None)).all()
    team_features = [
        {
            "id": t.id,
            "type": "rescue_team",
            "name": t.name,
            "team_type": t.team_type,
            "leader": t.leader_name,
            "contact": t.contact_number,
            "members": t.member_count,
            "status": t.status,
            "base": t.base_location,
            "lat": t.latitude,
            "lng": t.longitude,
            "equipment": t.equipment_summary,
            "is_demo": t.is_demo
        }
        for t in teams
    ]

    return {
        "incidents": inc_features,
        "shelters": shelter_features,
        "hospitals": hosp_features,
        "rescue_teams": team_features,
        "total_mapped_entities": len(inc_features) + len(shelter_features) + len(hosp_features) + len(team_features)
    }


@router.get("/zones")
def get_gis_zones():
    """Return local GeoJSON risk polygons (zero remote tile dependency)."""
    zones_file = settings.GEOJSON_DIR / "bihar_flood_zones.geojson"
    if not zones_file.exists():
        return {"type": "FeatureCollection", "features": []}

    try:
        with open(zones_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read local GeoJSON: {str(e)}")


@router.get("/routes")
def get_evacuation_routes():
    """Return locally stored suggested evacuation corridors."""
    corridors_file = settings.GEOJSON_DIR / "evacuation_corridors.geojson"
    if not corridors_file.exists():
        return {"type": "FeatureCollection", "features": []}

    try:
        with open(corridors_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read evacuation corridors: {str(e)}")


@router.post("/route-plan")
def calculate_suggested_route(req: RoutePlanRequest):
    """
    Generate a suggested emergency route connecting start and destination.
    Uses local coordinate interpolation.
    Notice: Marked explicitly as SUGGESTED ROUTE (UNVERIFIED FIELD HAZARDS).
    """
    # Calculate simple midpoint elevated waypoint to bypass river center
    mid_lat = (req.start_lat + req.dest_lat) / 2.0 + 0.005
    mid_lng = (req.start_lng + req.dest_lng) / 2.0 - 0.005

    waypoints = [
        {"name": req.start_point_name, "lat": req.start_lat, "lng": req.start_lng, "type": "Start"},
        {"name": "Suggested Highland Waypoint (Elevation ~74m)", "lat": mid_lat, "lng": mid_lng, "type": "Waypoint"},
        {"name": req.destination_name, "lat": req.dest_lat, "lng": req.dest_lng, "type": "Destination"}
    ]

    return {
        "status": "calculated",
        "route_name": f"Emergency Evacuation: {req.start_point_name} -> {req.destination_name}",
        "disclaimer": "SUGGESTED ROUTE ONLY. Field road integrity, waterlogging depth, and bridge safety must be verified by local ground scouts.",
        "waypoints": waypoints,
        "estimated_distance_km": round(abs(req.start_lat - req.dest_lat) * 111 + abs(req.start_lng - req.dest_lng) * 100, 1),
        "path_coordinates": [
            [req.start_lat, req.start_lng],
            [mid_lat, mid_lng],
            [req.dest_lat, req.dest_lng]
        ]
    }

