import os
import json
import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.models.models import Dataset, DatasetImportLog, ActivityLog, Incident, Shelter, Hospital

router = APIRouter(prefix="/api/data", tags=["Data & Dataset Management"])


def sync_default_datasets(db: Session):
    """Auto-index pre-loaded disaster datasets into database if not present."""
    default_files = [
        {
            "name": "Bihar Monsoon Rainfall Station Readings (2026)",
            "file_name": "bihar_monsoon_rainfall_2026.csv",
            "description": "Daily rainfall, historical averages and anomaly percentages across 10 meteorological stations.",
            "format": "CSV"
        },
        {
            "name": "Kosi River Basin Water Level & Gauges",
            "file_name": "kosi_river_gauge_monitoring.csv",
            "description": "Hydrological station water levels, danger marks, and cusecs discharge metrics.",
            "format": "CSV"
        }
    ]

    for item in default_files:
        f_path = settings.DATASETS_DIR / item["file_name"]
        if f_path.exists():
            existing = db.query(Dataset).filter(Dataset.file_name == item["file_name"]).first()
            if not existing:
                try:
                    df = pd.read_csv(f_path)
                    cols = list(df.columns)
                    d = Dataset(
                        name=item["name"],
                        file_name=item["file_name"],
                        file_format=item["format"],
                        record_count=len(df),
                        columns_json=json.dumps(cols),
                        description=item["description"],
                        uploaded_by="Sentinel System Preload",
                        created_at=datetime.datetime.now(datetime.UTC)
                    )
                    db.add(d)
                    db.commit()
                    db.refresh(d)

                    log = DatasetImportLog(
                        dataset_id=d.id,
                        status="Completed",
                        rows_imported=len(df),
                        created_at=datetime.datetime.now(datetime.UTC)
                    )
                    db.add(log)
                    db.commit()
                except Exception as e:
                    db.rollback()
                    print(f"Error syncing {item['file_name']}: {e}")


@router.get("/datasets")
def list_datasets(db: Session = Depends(get_db)):
    """List all available disaster intelligence datasets."""
    sync_default_datasets(db)
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
    results = []
    for d in datasets:
        try:
            cols = json.loads(d.columns_json) if d.columns_json else []
        except Exception:
            cols = []

        # Find file path
        f_path = settings.UPLOADS_DIR / d.file_name
        if not f_path.exists():
            f_path = settings.DATASETS_DIR / d.file_name

        file_size_kb = round(f_path.stat().st_size / 1024, 1) if f_path.exists() else 0

        results.append({
            "id": d.id,
            "name": d.name,
            "file_name": d.file_name,
            "file_format": d.file_format,
            "record_count": d.record_count,
            "columns": cols,
            "description": d.description,
            "uploaded_by": d.uploaded_by,
            "file_size_kb": file_size_kb,
            "created_at": d.created_at
        })
    return results


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload and parse an offline CSV or GeoJSON disaster dataset."""
    filename = file.filename
    if not filename.endswith(('.csv', '.geojson', '.json')):
        raise HTTPException(status_code=400, detail="Only .csv and .geojson/.json files are supported")

    dest_path = settings.UPLOADS_DIR / filename
    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    file_format = "CSV" if filename.endswith('.csv') else "GeoJSON"
    record_count = 0
    columns = []

    try:
        if file_format == "CSV":
            df = pd.read_csv(dest_path)
            record_count = len(df)
            columns = list(df.columns)
        else:
            with open(dest_path, 'r', encoding='utf-8') as jf:
                data = json.load(jf)
                if isinstance(data, dict) and "features" in data:
                    record_count = len(data["features"])
                    if record_count > 0:
                        columns = list(data["features"][0].get("properties", {}).keys())
                elif isinstance(data, list):
                    record_count = len(data)
                    if record_count > 0 and isinstance(data[0], dict):
                        columns = list(data[0].keys())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    dataset_name = name or Path(filename).stem.replace('_', ' ').title()

    d = Dataset(
        name=dataset_name,
        file_name=filename,
        file_format=file_format,
        record_count=record_count,
        columns_json=json.dumps(columns),
        description=description or f"Locally imported {file_format} dataset.",
        uploaded_by="EOC Operator",
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(d)
    db.commit()
    db.refresh(d)

    log = DatasetImportLog(
        dataset_id=d.id,
        status="Completed",
        rows_imported=record_count,
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(log)

    audit = ActivityLog(
        action=f"Dataset Uploaded ({file_format})",
        entity_type="Dataset",
        entity_id=d.id,
        details_json=json.dumps({"name": d.name, "rows": record_count}),
        ip_address="127.0.0.1",
        timestamp=datetime.datetime.now(datetime.UTC)
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "id": d.id,
        "name": d.name,
        "file_name": d.file_name,
        "record_count": d.record_count,
        "columns": columns
    }


@router.get("/preview/{dataset_id}")
def preview_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Preview first 10 rows and summary statistics of a dataset."""
    d = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")

    f_path = settings.UPLOADS_DIR / d.file_name
    if not f_path.exists():
        f_path = settings.DATASETS_DIR / d.file_name

    if not f_path.exists():
        raise HTTPException(status_code=404, detail="File on disk not found")

    try:
        if d.file_format == "CSV":
            df = pd.read_csv(f_path)
            sample_df = df.head(10).fillna("")
            return {
                "id": d.id,
                "name": d.name,
                "columns": list(df.columns),
                "total_rows": len(df),
                "preview_rows": sample_df.to_dict(orient="records")
            }
        else:
            with open(f_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            features = data.get("features", [])[:10] if isinstance(data, dict) else data[:10]
            records = [feat.get("properties", {}) if isinstance(feat, dict) else feat for feat in features]
            return {
                "id": d.id,
                "name": d.name,
                "columns": list(records[0].keys()) if records else [],
                "total_rows": d.record_count,
                "preview_rows": records
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading dataset preview: {str(e)}")


@router.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Delete an imported dataset and its local file."""
    d = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")

    f_path = settings.UPLOADS_DIR / d.file_name
    if f_path.exists():
        try:
            os.remove(f_path)
        except Exception:
            pass

    db.delete(d)
    db.commit()

    return {"status": "success", "message": f"Dataset {dataset_id} deleted"}

