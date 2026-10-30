import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["system"] == "PROJECT SENTINEL"
    assert data["database"]["status"] == "connected"
    assert data["database"]["tables_count"] >= 33


def test_ai_status_endpoint():
    response = client.get("/api/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert "installed" in data
    assert "available_models" in data


def test_ai_conversation_lifecycle():
    # 1. Create a conversation
    create_res = client.post("/api/ai/conversations", json={"title": "Test Disaster Session"})
    assert create_res.status_code == 200
    conv = create_res.json()
    conv_id = conv["id"]
    assert conv["title"] == "Test Disaster Session"

    # 2. Get list of conversations
    list_res = client.get("/api/ai/conversations")
    assert list_res.status_code == 200
    convs = list_res.json()
    assert any(c["id"] == conv_id for c in convs)

    # 3. Get conversation detail
    detail_res = client.get(f"/api/ai/conversations/{conv_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == conv_id

    # 4. Clean up - Delete conversation
    del_res = client.delete(f"/api/ai/conversations/{conv_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

