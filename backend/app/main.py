from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.database.session import SessionLocal
from backend.app.database.init_db import init_db
from backend.app.services.ollama_service import get_ollama_status, list_installed_models
from backend.app.routes.ai import router as ai_router
from backend.app.routes.dashboard import router as dashboard_router
from backend.app.routes.risk import router as risk_router
from backend.app.routes.gis import router as gis_router
from backend.app.routes.operations import router as operations_router
from backend.app.routes.reports import router as reports_router
from backend.app.routes.recovery import router as recovery_router
from backend.app.routes.auth import router as auth_router
from backend.app.routes.data_management import router as data_router
from sqlalchemy import text
import logging

# Ensure database tables exist on startup
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Disaster Intelligence Network & Emergency Operations Center",
    version=settings.VERSION
)

# Enable CORS for local Vite development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(ai_router)
app.include_router(dashboard_router)
app.include_router(risk_router)
app.include_router(gis_router)
app.include_router(operations_router)
app.include_router(reports_router)
app.include_router(recovery_router)
app.include_router(auth_router)
app.include_router(data_router)

@app.get("/api/health")
def health_check():
    """Health check endpoint confirming local application readiness."""
    db_status = "error"
    db_tables_count = 0
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT count(*) FROM sqlite_master WHERE type='table';")).scalar()
        db_tables_count = result
        db_status = "connected"
        db.close()
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    ollama_info = get_ollama_status()

    return {
        "status": "operational",
        "system": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "version": settings.VERSION,
        "database": {
            "status": db_status,
            "engine": "SQLite",
            "tables_count": db_tables_count,
        },
        "ai_engine": ollama_info,
    }


@app.get("/api/models")
def get_models():
    """Detect and return locally installed Ollama models without external requests."""
    models = list_installed_models()
    return {"models": models}

