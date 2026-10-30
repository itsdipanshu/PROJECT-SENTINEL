import logging
from backend.app.database.session import engine, SessionLocal, Base
from backend.app.models.models import User, Role, ApplicationSetting
from backend.app.core.security import get_password_hash

logger = logging.getLogger(__name__)


def init_db():
    # Create all database tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check and seed default roles
        default_roles = [
            ("Super Administrator", "Complete application control and system administration"),
            ("Disaster Administrator", "Manage incidents, resources, shelters, and hospitals"),
            ("Emergency Coordinator", "Assign rescue teams and monitor emergency operations"),
            ("Rescue Team Member", "Field rescuer with operational updates and reporting access"),
            ("Data Analyst", "Upload datasets, run risk assessments, and generate reports"),
            ("Viewer", "Read-only access to authorized disaster intelligence information"),
        ]

        for role_name, description in default_roles:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                db.add(Role(name=role_name, description=description))

        # Check and seed initial users
        default_users = [
            ("admin", "Dipanshu@gmail.com", "Admin Commander", "Super Administrator"),
            ("coordinator", "coordinator@sentinel.local", "Senior Emergency Coordinator", "Emergency Coordinator"),
            ("responder", "responder@sentinel.local", "NDRF 9th Bn Team Leader", "Rescue Team Member"),
            ("analyst", "analyst@sentinel.local", "Lead GIS & Risk Analyst", "Data Analyst")
        ]

        for uname, uemail, ufullname, urole in default_users:
            usr = db.query(User).filter(User.username == uname).first()
            if not usr:
                db.add(User(
                    username=uname,
                    email=uemail,
                    hashed_password=get_password_hash("Sentinel@2026"),
                    full_name=ufullname,
                    role=urole,
                    is_active=True
                ))

        # Seed initial system settings
        default_settings = [
            ("system_name", "PROJECT SENTINEL", "General", "Name of the disaster intelligence system"),
            ("system_status", "Active Monitoring", "General", "Current operational posture"),
            ("ollama_model", "gemma4:e4b", "AI", "Active local Ollama model for Sentinel AI"),
            ("ollama_timeout", "120", "AI", "Timeout in seconds for local AI CLI execution"),
            ("demo_mode_loaded", "false", "Demo", "Whether demonstration scenario is loaded"),
        ]

        for key, value, cat, desc in default_settings:
            setting = db.query(ApplicationSetting).filter(ApplicationSetting.setting_key == key).first()
            if not setting:
                db.add(ApplicationSetting(
                    setting_key=key,
                    setting_value=value,
                    category=cat,
                    description=desc
                ))

        db.commit()
        print("Database schema and initial seed data initialized successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
