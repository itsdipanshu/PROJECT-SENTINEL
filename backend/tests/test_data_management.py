import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_list_and_sync_datasets():
    # 1. Fetch datasets list (triggers auto-sync of preloaded CSVs)
    res = client.get("/api/data/datasets")
    assert res.status_code == 200
    datasets = res.json()
    assert len(datasets) >= 2
    filenames = [d["file_name"] for d in datasets]
    assert "bihar_monsoon_rainfall_2026.csv" in filenames
    assert "kosi_river_gauge_monitoring.csv" in filenames


def test_preview_dataset():
    # 1. Get first dataset
    datasets = client.get("/api/data/datasets").json()
    assert len(datasets) > 0
    d_id = datasets[0]["id"]

    # 2. Preview rows
    prev_res = client.get(f"/api/data/preview/{d_id}")
    assert prev_res.status_code == 200
    prev_data = prev_res.json()
    assert "columns" in prev_data
    assert len(prev_data["columns"]) > 0
    assert "preview_rows" in prev_data
    assert len(prev_data["preview_rows"]) > 0
    assert prev_data["total_rows"] > 0


def test_upload_and_delete_dataset():
    # 1. Construct test CSV
    csv_content = b"Station,Water_Level,Danger_Mark\nBirpur,75.2,74.5\nSupaul,46.1,45.0\n"
    test_file = io.BytesIO(csv_content)

    upload_res = client.post(
        "/api/data/upload",
        files={"file": ("test_flood_gauges.csv", test_file, "text/csv")},
        data={
            "name": "Test Hydro Gauges",
            "description": "Integration test gauge dataset"
        }
    )
    assert upload_res.status_code == 200
    uploaded_data = upload_res.json()
    assert uploaded_data["status"] == "success"
    uploaded_id = uploaded_data["id"]
    assert uploaded_data["record_count"] == 2
    assert "Station" in uploaded_data["columns"]

    # 2. Preview uploaded
    prev_res = client.get(f"/api/data/preview/{uploaded_id}")
    assert prev_res.status_code == 200
    assert prev_res.json()["total_rows"] == 2

    # 3. Delete dataset
    del_res = client.delete(f"/api/data/datasets/{uploaded_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

