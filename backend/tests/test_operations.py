import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_incident_lifecycle():
    # 1. Create incident
    res = client.post("/api/operations/incidents", json={
        "title": "Submerged Culvert Roadway",
        "disaster_category": "Flood",
        "description": "High current overtopping the local culvert crossing.",
        "location_name": "Ward 2 Culvert",
        "latitude": 26.54,
        "longitude": 87.03,
        "severity": "High",
        "affected_population": 400
    })
    assert res.status_code == 200
    inc = res.json()
    inc_id = inc["id"]
    assert inc["status"] == "Reported"

    # 2. Advance status to Response Active
    status_res = client.patch(f"/api/operations/incidents/{inc_id}/status", json={
        "new_status": "Response Active",
        "update_text": "NDRF dispatched with 2 inflatable boats.",
        "updated_by": "Ops Lead"
    })
    assert status_res.status_code == 200
    assert status_res.json()["incident"]["status"] == "Response Active"

    # 3. Check incident detail and timeline
    detail_res = client.get(f"/api/operations/incidents/{inc_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["timeline"]) >= 2


def test_resource_non_negative_validation():
    # 1. Create resource
    res = client.post("/api/operations/resources", json={
        "name": "Emergency Blankets",
        "category": "Blankets",
        "quantity": 100,
        "unit": "Pcs",
        "storage_location": "Central Depot"
    })
    assert res.status_code == 200
    res_id = res.json()["id"]

    # 2. Valid allocation
    alloc_res = client.post(f"/api/operations/resources/{res_id}/adjust", json={
        "transaction_type": "Allocation",
        "delta_quantity": 40,
        "notes": "Sent to camp"
    })
    assert alloc_res.status_code == 200
    assert alloc_res.json()["available_quantity"] == 60

    # 3. Invalid over-allocation (must fail with 400)
    over_res = client.post(f"/api/operations/resources/{res_id}/adjust", json={
        "transaction_type": "Allocation",
        "delta_quantity": 90,
        "notes": "Excessive request"
    })
    assert over_res.status_code == 400
    assert "Cannot allocate" in over_res.json()["detail"]


def test_shelter_and_hospital_updates():
    # Shelter
    shelters = client.get("/api/operations/shelters").json()
    if shelters:
        s_id = shelters[0]["id"]
        up_res = client.patch(f"/api/operations/shelters/{s_id}/occupancy", json={
            "current_occupancy": 150,
            "remarks": "Night intake"
        })
        assert up_res.status_code == 200
        assert up_res.json()["current_occupancy"] == 150

    # Hospital
    hospitals = client.get("/api/operations/hospitals").json()
    if hospitals:
        h_id = hospitals[0]["id"]
        h_res = client.patch(f"/api/operations/hospitals/{h_id}/availability", json={
            "available_beds": 45,
            "available_ambulances": 7
        })
        assert h_res.status_code == 200
        assert h_res.json()["available_beds"] == 45
        assert h_res.json()["available_ambulances"] == 7


def test_alert_lifecycle():
    # 1. Broadcast
    res = client.post("/api/operations/alerts", json={
        "title": "Severe Flash Runoff Notice",
        "alert_type": "Flood warning",
        "severity": "Critical",
        "message": "Immediate high ground evacuation mandated.",
        "location_name": "Basin Sector A"
    })
    assert res.status_code == 200
    a_id = res.json()["id"]

    # 2. Resolve
    res_up = client.patch(f"/api/operations/alerts/{a_id}/status?status=Resolved")
    assert res_up.status_code == 200
    assert res_up.json()["status"] == "Resolved"

