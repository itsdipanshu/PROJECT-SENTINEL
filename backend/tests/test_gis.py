import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_gis_features():
    res = client.get("/api/gis/features")
    assert res.status_code == 200
    data = res.json()
    assert "incidents" in data
    assert "shelters" in data
    assert "hospitals" in data
    assert "rescue_teams" in data
    assert data["total_mapped_entities"] >= 0


def test_gis_zones_geojson():
    res = client.get("/api/gis/zones")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) > 0


def test_gis_evacuation_routes():
    res = client.get("/api/gis/routes")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0


def test_route_planner():
    res = client.post("/api/gis/route-plan", json={
        "start_point_name": "Birpur Inundated Village",
        "destination_name": "Birpur High School Shelter",
        "start_lat": 26.5218,
        "start_lng": 87.0142,
        "dest_lat": 26.5250,
        "dest_lng": 87.0180,
        "avoid_hazards": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "calculated"
    assert "waypoints" in data
    assert len(data["waypoints"]) >= 3
    assert "SUGGESTED ROUTE" in data["disclaimer"]

