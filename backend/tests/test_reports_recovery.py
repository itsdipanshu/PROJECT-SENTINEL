import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_generate_and_list_reports():
    # 1. Generate SITREP PDF
    res_pdf = client.post("/api/reports/generate", json={
        "report_type": "Situation",
        "file_format": "PDF",
        "generated_by": "Test Officer"
    })
    assert res_pdf.status_code == 200
    pdf_data = res_pdf.json()
    assert pdf_data["status"] == "success"
    assert pdf_data["file_format"] == "PDF"
    rep_pdf_id = pdf_data["id"]

    # 2. Generate Resource CSV
    res_csv = client.post("/api/reports/generate", json={
        "report_type": "Resource",
        "file_format": "CSV",
        "generated_by": "Test Officer"
    })
    assert res_csv.status_code == 200
    csv_data = res_csv.json()
    assert csv_data["status"] == "success"
    assert csv_data["file_format"] == "CSV"
    rep_csv_id = csv_data["id"]

    # 3. List reports and check both are present
    list_res = client.get("/api/reports/list")
    assert list_res.status_code == 200
    reports = list_res.json()
    report_ids = [r["id"] for r in reports]
    assert rep_pdf_id in report_ids
    assert rep_csv_id in report_ids

    # 4. Download PDF
    down_pdf = client.get(f"/api/reports/download/{rep_pdf_id}")
    assert down_pdf.status_code == 200
    assert len(down_pdf.content) > 0

    # 5. Download CSV
    down_csv = client.get(f"/api/reports/download/{rep_csv_id}")
    assert down_csv.status_code == 200
    assert b"Resource Name,Category" in down_csv.content or len(down_csv.content) > 0


def test_recovery_projects_workflow():
    # 1. Create a recovery project
    create_res = client.post("/api/recovery/projects", json={
        "title": "Kosi Embankment Breached Wall Restoration",
        "location_name": "Birpur Sector 4",
        "infrastructure_type": "Embankments & Dykes",
        "estimated_cost": 750000.0,
        "status": "Planned",
        "is_demo": False
    })
    assert create_res.status_code == 200
    proj = create_res.json()
    proj_id = proj["id"]
    assert proj["title"] == "Kosi Embankment Breached Wall Restoration"

    # 2. Add a recovery milestone task
    task_res = client.post(f"/api/recovery/projects/{proj_id}/tasks", json={
        "task_name": "Geotextile and sandbag reinforcement",
        "assigned_to": "Irrigation & Flood Control Division"
    })
    assert task_res.status_code == 200
    task = task_res.json()
    task_id = task["id"]
    assert task["task_name"] == "Geotextile and sandbag reinforcement"

    # 3. Update task status
    update_task_res = client.patch(f"/api/recovery/tasks/{task_id}?status=In Progress")
    assert update_task_res.status_code == 200
    assert update_task_res.json()["status"] == "In Progress"

    # 4. Update project progress and expenditure
    update_proj_res = client.patch(f"/api/recovery/projects/{proj_id}", json={
        "progress_percent": 45,
        "actual_expenditure": 320000.0,
        "status": "In Progress"
    })
    assert update_proj_res.status_code == 200
    updated_p = update_proj_res.json()
    assert updated_p["progress_percent"] == 45
    assert updated_p["actual_expenditure"] == 320000.0

    # 5. List projects and verify counts
    list_res = client.get("/api/recovery/projects")
    assert list_res.status_code == 200
    projects = list_res.json()
    matched = [p for p in projects if p["id"] == proj_id]
    assert len(matched) == 1
    assert matched[0]["task_count"] >= 1

