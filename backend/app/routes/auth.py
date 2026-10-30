import json
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from backend.app.database.session import get_db
from backend.app.models.models import User, Role, ActivityLog, ApplicationSetting
from backend.app.core.security import (
    verify_password, get_password_hash, create_access_token, decode_access_token
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Administration"])


# Pydantic Schemas
class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: Optional[str] = "Viewer"


class ChangePasswordRequest(BaseModel):
    username: str
    current_password: str
    new_password: str = Field(..., min_length=6)


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserRoleUpdate(BaseModel):
    role: str


class SettingUpdate(BaseModel):
    setting_key: str
    setting_value: str


def get_current_user_from_token(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[User]:
    """Helper to authenticate requests using Bearer JWT."""
    if not authorization:
        return None
    try:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        token = parts[1]
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None
        username = payload["sub"]
        user = db.query(User).filter(User.username == username).first()
        return user
    except Exception:
        return None


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate local user and issue JWT session token."""
    user = db.query(User).filter(
        (User.username == req.username) | (User.email == req.username)
    ).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact the Super Administrator."
        )

    token = create_access_token({
        "sub": user.username,
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name
    })

    # Log action
    log = ActivityLog(
        user_id=user.id,
        action="User Login",
        entity_type="User",
        entity_id=user.id,
        details_json=json.dumps({"username": user.username, "role": user.role}),
        ip_address="127.0.0.1",
        timestamp=datetime.datetime.now(datetime.UTC)
    )
    db.add(log)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active
        }
    }


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user in the local system."""
    existing_user = db.query(User).filter(
        (User.username == req.username) | (User.email == req.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    valid_roles = [
        "Super Administrator", "Disaster Administrator",
        "Emergency Coordinator", "Rescue Team Member",
        "Data Analyst", "Viewer"
    ]
    role_to_set = req.role if req.role in valid_roles else "Viewer"

    new_user = User(
        username=req.username,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role=role_to_set,
        is_active=True,
        created_at=datetime.datetime.now(datetime.UTC)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log action
    log = ActivityLog(
        user_id=new_user.id,
        action="User Registered",
        entity_type="User",
        entity_id=new_user.id,
        details_json=json.dumps({"username": new_user.username, "role": new_user.role}),
        ip_address="127.0.0.1",
        timestamp=datetime.datetime.now(datetime.UTC)
    )
    db.add(log)
    db.commit()

    return {
        "status": "success",
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "is_active": new_user.is_active
        }
    }


@router.get("/me")
def get_current_user_profile(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Return the profile of the currently signed-in user."""
    user = get_current_user_from_token(authorization, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at
    }


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db)):
    """Change local password for a user."""
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    user.hashed_password = get_password_hash(req.new_password)
    user.updated_at = datetime.datetime.now(datetime.UTC)

    log = ActivityLog(
        user_id=user.id,
        action="Password Changed",
        entity_type="User",
        entity_id=user.id,
        details_json=json.dumps({"username": user.username}),
        ip_address="127.0.0.1",
        timestamp=datetime.datetime.now(datetime.UTC)
    )
    db.add(log)
    db.commit()

    return {"status": "success", "message": "Password changed successfully"}


@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    """List all registered system users (Administration module)."""
    users = db.query(User).order_by(User.created_at.asc()).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at
        }
        for u in users
    ]


@router.patch("/users/{user_id}/status")
def update_user_status(user_id: int, req: UserStatusUpdate, db: Session = Depends(get_db)):
    """Toggle user active / suspended status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = req.is_active
    user.updated_at = datetime.datetime.now(datetime.UTC)

    log = ActivityLog(
        action=f"User Status Updated ({'Active' if req.is_active else 'Disabled'})",
        entity_type="User",
        entity_id=user.id,
        details_json=json.dumps({"user_id": user.id, "is_active": req.is_active}),
        ip_address="127.0.0.1",
        timestamp=datetime.datetime.now(datetime.UTC)
    )
    db.add(log)
    db.commit()

    return {
        "status": "success",
        "id": user.id,
        "username": user.username,
        "is_active": user.is_active
    }


@router.patch("/users/{user_id}/role")
def update_user_role(user_id: int, req: UserRoleUpdate, db: Session = Depends(get_db)):
    """Update role for a user (Super Administrator only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.role
    user.role = req.role
    user.updated_at = datetime.datetime.now(datetime.UTC)

    log = ActivityLog(
        action=f"User Role Changed ({old_role} -> {req.role})",
        entity_type="User",
        entity_id=user.id,
        details_json=json.dumps({"old_role": old_role, "new_role": req.role}),
        ip_address="127.0.0.1",
        timestamp=datetime.datetime.now(datetime.UTC)
    )
    db.add(log)
    db.commit()

    return {
        "status": "success",
        "id": user.id,
        "username": user.username,
        "role": user.role
    }


@router.get("/audit-logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Get system audit activity logs."""
    logs = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(limit).all()
    results = []
    for l in logs:
        u_name = l.user.username if l.user else "System"
        results.append({
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": json.loads(l.details_json) if l.details_json else {},
            "username": u_name,
            "ip_address": l.ip_address,
            "timestamp": l.timestamp
        })
    return results


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    """Retrieve application configuration parameters."""
    settings_records = db.query(ApplicationSetting).all()
    return [
        {
            "id": s.id,
            "key": s.setting_key,
            "value": s.setting_value,
            "category": s.category,
            "description": s.description,
            "updated_at": s.updated_at
        }
        for s in settings_records
    ]


@router.post("/settings")
def update_setting(req: SettingUpdate, db: Session = Depends(get_db)):
    """Update a specific application setting."""
    setting = db.query(ApplicationSetting).filter(ApplicationSetting.setting_key == req.setting_key).first()
    if not setting:
        setting = ApplicationSetting(
            setting_key=req.setting_key,
            setting_value=req.setting_value,
            category="General"
        )
        db.add(setting)
    else:
        setting.setting_value = req.setting_value
        setting.updated_at = datetime.datetime.now(datetime.UTC)

    log = ActivityLog(
        action=f"Setting Updated: {req.setting_key}",
        entity_type="Setting",
        entity_id=setting.id,
        details_json=json.dumps({"key": req.setting_key, "value": req.setting_value}),
        ip_address="127.0.0.1",
        timestamp=datetime.datetime.now(datetime.UTC)
    )
    db.add(log)
    db.commit()

    return {"status": "success", "key": setting.setting_key, "value": setting.setting_value}
