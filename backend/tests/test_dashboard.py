import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_dashboard_stats():
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    data = res.json()
    assert "total_incidents" in data
    assert "active_emergencies" in data
    assert "available_rescue_teams" in data
    assert "total_shelters" in data


def test_dashboard_charts():
    res = client.get("/api/dashboard/charts")
    assert res.status_code == 200
    data = res.json()
    assert "incidents_by_category" in data
    assert "shelters" in data
    assert "hospitals" in data


def test_demo_lifecycle():
    # 0. Ensure clean state
    client.post("/api/dashboard/demo/clear")

    # 1. Load Bihar flood demo dataset
    load_res = client.post("/api/dashboard/demo/load")
    assert load_res.status_code == 200
    load_data = load_res.json()
    assert load_data["status"] in ["success", "already_loaded"]

    # 2. Check stats updated
    stats_res = client.get("/api/dashboard/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_incidents"] > 0
    assert stats["is_demo_loaded"] is True

    # 3. Check recent incidents has demo incidents
    inc_res = client.get("/api/dashboard/recent-incidents?limit=25")
    assert inc_res.status_code == 200
    incidents = inc_res.json()
    assert len(incidents) > 0
    assert any("[DEMO]" in inc["title"] or inc["is_demo"] for inc in incidents)

    # 4. Check alerts has demo alerts
    alert_res = client.get("/api/dashboard/alerts")
    assert alert_res.status_code == 200
    alerts = alert_res.json()
    assert len(alerts) > 0

    # 5. Clear demo data
    clear_res = client.post("/api/dashboard/demo/clear")
    assert clear_res.status_code == 200
    assert clear_res.json()["status"] == "success"

    # 6. Verify cleared
    stats_after = client.get("/api/dashboard/stats").json()
    assert stats_after["is_demo_loaded"] is False
    inc_after = client.get("/api/dashboard/recent-incidents").json()
    assert not any("[DEMO]" in inc["title"] for inc in inc_after)

