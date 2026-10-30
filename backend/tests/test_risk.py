import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_risk_evaluate_preview():
    # Flood preview
    res = client.post("/api/risk/evaluate", json={
        "disaster_type": "Flood",
        "location_name": "Test River Basin",
        "parameters": {
            "rainfall_24h_mm": 180,
            "river_level_m": 73.5,
            "danger_level_m": 71.0,
            "soil_saturation_pct": 88,
            "distance_to_river_km": 1.2,
            "drainage_condition": "Poor"
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert data["risk_score"] > 70
    assert data["risk_category"] in ["HIGH", "VERY HIGH", "CRITICAL"]
    assert "River Level Relative to Danger Mark" in data["contributing_factors"]
    assert len(data["suggested_precautions"]) > 0


def test_risk_assessment_persistence_lifecycle():
    # 1. Create and save assessment
    res = client.post("/api/risk/assessments", json={
        "disaster_type": "Landslide",
        "location_name": "Himalayan Ridge Sector 2",
        "latitude": 27.15,
        "longitude": 88.22,
        "parameters": {
            "slope_degrees": 42,
            "soil_type": "Clay",
            "rainfall_48h_mm": 140,
            "vegetation_cover": "Barren"
        },
        "assessed_by": "Test Analyst",
        "is_demo": False
    })
    assert res.status_code == 200
    asm = res.json()
    asm_id = asm["id"]
    assert asm["risk_score"] > 60
    assert asm["disaster_type"] == "Landslide"

    # 2. Query list
    list_res = client.get("/api/risk/assessments?disaster_type=Landslide")
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(i["id"] == asm_id for i in items)

    # 3. Query detail
    detail_res = client.get(f"/api/risk/assessments/{asm_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == asm_id

    # 4. Clean up
    del_res = client.delete(f"/api/risk/assessments/{asm_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

