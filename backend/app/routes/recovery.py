import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional

from backend.app.database.session import get_db
from backend.app.models.models import RecoveryProject, RecoveryTask

router = APIRouter(prefix="/api/recovery", tags=["Post-Disaster Recovery & Reconstruction"])


class RecoveryProjectCreate(BaseModel):
    title: str = Field(..., min_length=3)
    location_name: str
    infrastructure_type: str = Field(..., description="Roads, Bridges, Schools, Hospitals, Houses, Electricity, Water supply, Communication")
    estimated_cost: float
    status: Optional[str] = "Planned"
    is_demo: Optional[bool] = False


class RecoveryProjectUpdate(BaseModel):
    progress_percent: int = Field(..., ge=0, le=100)
    actual_expenditure: float
    status: str = Field(..., description="Not Started, Planned, In Progress, Completed, Delayed")


class RecoveryTaskCreate(BaseModel):
    task_name: str
    assigned_to: Optional[str] = "Civil Works Unit"
    due_date: Optional[datetime.datetime] = None


@router.get("/projects")
def list_recovery_projects(db: Session = Depends(get_db)):
    """List all infrastructure restoration projects."""
    projects = db.query(RecoveryProject).order_by(RecoveryProject.created_at.desc()).all()
    result = []
    for p in projects:
        tasks = db.query(RecoveryTask).filter(RecoveryTask.project_id == p.id).all()
        result.append({
            "id": p.id,
            "project_id": p.project_id,
            "title": p.title,
            "location_name": p.location_name,
            "infrastructure_type": p.infrastructure_type,
            "estimated_cost": p.estimated_cost,
            "actual_expenditure": p.actual_expenditure,
            "progress_percent": p.progress_percent,
            "status": p.status,
            "is_demo": p.is_demo,
            "created_at": p.created_at,
            "task_count": len(tasks),
            "completed_tasks_count": sum(1 for t in tasks if t.status == "Completed")
        })
    return result


@router.post("/projects")
def create_recovery_project(req: RecoveryProjectCreate, db: Session = Depends(get_db)):
    """Register a new infrastructure recovery and reconstruction project."""
    proj_id = f"REC-{datetime.datetime.now(datetime.UTC).strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"

    project = RecoveryProject(
        project_id=proj_id,
        title=req.title,
        location_name=req.location_name,
        infrastructure_type=req.infrastructure_type,
        estimated_cost=req.estimated_cost,
        actual_expenditure=0.0,
        status=req.status or "Planned",
        progress_percent=0,
        is_demo=req.is_demo or False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        "id": project.id,
        "project_id": project.project_id,
        "title": project.title,
        "location_name": project.location_name,
        "infrastructure_type": project.infrastructure_type,
        "estimated_cost": project.estimated_cost,
        "actual_expenditure": project.actual_expenditure,
        "progress_percent": project.progress_percent,
        "status": project.status,
        "is_demo": project.is_demo,
        "created_at": project.created_at
    }


@router.patch("/projects/{project_id}")
def update_project_progress(project_id: int, req: RecoveryProjectUpdate, db: Session = Depends(get_db)):
    """Update progress percentage and expenditure for a recovery project."""
    p = db.query(RecoveryProject).filter(RecoveryProject.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Recovery project not found")

    p.progress_percent = req.progress_percent
    p.actual_expenditure = req.actual_expenditure
    p.status = req.status
    if req.progress_percent >= 100:
        p.status = "Completed"

    db.commit()
    db.refresh(p)
    return {
        "id": p.id,
        "project_id": p.project_id,
        "title": p.title,
        "progress_percent": p.progress_percent,
        "actual_expenditure": p.actual_expenditure,
        "status": p.status
    }


@router.post("/projects/{project_id}/tasks")
def add_recovery_task(project_id: int, req: RecoveryTaskCreate, db: Session = Depends(get_db)):
    """Add a milestone task to a recovery project."""
    p = db.query(RecoveryProject).filter(RecoveryProject.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Recovery project not found")

    task = RecoveryTask(
        project_id=p.id,
        task_name=req.task_name,
        assigned_to=req.assigned_to,
        status="Pending",
        start_date=datetime.datetime.utcnow(),
        due_date=req.due_date
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return {
        "id": task.id,
        "project_id": task.project_id,
        "task_name": task.task_name,
        "assigned_to": task.assigned_to,
        "status": task.status
    }


@router.patch("/tasks/{task_id}")
def update_task_status(task_id: int, status: str, db: Session = Depends(get_db)):
    """Update status of a recovery task."""
    t = db.query(RecoveryTask).filter(RecoveryTask.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    t.status = status
    db.commit()
    db.refresh(t)
    return {
        "id": t.id,
        "project_id": t.project_id,
        "task_name": t.task_name,
        "status": t.status
    }
