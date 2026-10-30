import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_login_and_auth_flow():
    # 1. Successful login
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Sentinel@2026"
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Super Administrator"
    token = data["access_token"]

    # 2. Failed login (wrong password)
    fail_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "WrongPassword123"
    })
    assert fail_res.status_code == 401

    # 3. Retrieve /api/auth/me with Bearer token
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["username"] == "admin"

    # 4. Access /api/auth/me without token fails
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401


def test_user_registration_and_management():
    # 1. Register a new emergency officer with unique username
    unique_id = uuid.uuid4().hex[:6]
    test_uname = f"coord_{unique_id}"
    test_email = f"coord_{unique_id}@sentinel.local"

    reg_res = client.post("/api/auth/register", json={
        "username": test_uname,
        "email": test_email,
        "password": "SecurePassword123",
        "full_name": "Patna Sector Commander",
        "role": "Emergency Coordinator"
    })
    assert reg_res.status_code == 200
    new_user = reg_res.json()["user"]
    user_id = new_user["id"]
    assert new_user["username"] == test_uname
    assert new_user["role"] == "Emergency Coordinator"

    # 2. List all users
    users_res = client.get("/api/auth/users")
    assert users_res.status_code == 200
    users = users_res.json()
    usernames = [u["username"] for u in users]
    assert test_uname in usernames

    # 3. Update user role
    role_res = client.patch(f"/api/auth/users/{user_id}/role", json={
        "role": "Disaster Administrator"
    })
    assert role_res.status_code == 200
    assert role_res.json()["role"] == "Disaster Administrator"

    # 4. Toggle active status
    status_res = client.patch(f"/api/auth/users/{user_id}/status", json={
        "is_active": False
    })
    assert status_res.status_code == 200
    assert status_res.json()["is_active"] is False

    # 5. Verify disabled account cannot login
    disabled_login = client.post("/api/auth/login", json={
        "username": test_uname,
        "password": "SecurePassword123"
    })
    assert disabled_login.status_code == 403


def test_audit_logs_and_application_settings():
    # 1. Fetch audit activity logs
    logs_res = client.get("/api/auth/audit-logs?limit=20")
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) > 0
    actions = [l["action"] for l in logs]
    assert any("User" in a or "Login" in a or "Setting" in a for a in actions)

    # 2. Update an application setting
    setting_res = client.post("/api/auth/settings", json={
        "setting_key": "system_posture",
        "setting_value": "Code Red Disaster Response"
    })
    assert setting_res.status_code == 200
    assert setting_res.json()["value"] == "Code Red Disaster Response"

    # 3. Retrieve settings
    all_settings_res = client.get("/api/auth/settings")
    assert all_settings_res.status_code == 200
    all_settings = all_settings_res.json()
    matched = [s for s in all_settings if s["key"] == "system_posture"]
    assert len(matched) == 1
    assert matched[0]["value"] == "Code Red Disaster Response"
