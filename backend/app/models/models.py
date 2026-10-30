import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base


# ==============================================================================
# 1. AUTHENTICATION & USERS
# ==============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="Viewer")  # Super Administrator, Disaster Administrator, Emergency Coordinator, Rescue Team Member, Data Analyst, Viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_revoked = Column(Boolean, default=False)

    user = relationship("User", back_populates="sessions")


# ==============================================================================
# 2. EMERGENCY INCIDENTS & UPDATES
# ==============================================================================

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(30), unique=True, index=True, nullable=False)  # e.g., "INC-2026-001"
    title = Column(String(200), nullable=False)
    disaster_category = Column(String(50), nullable=False)  # Flood, Landslide, Heavy Rainfall, Storm, Heatwave, Drought
    description = Column(Text, nullable=False)
    location_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    reported_at = Column(DateTime, default=datetime.datetime.utcnow)
    severity = Column(String(20), default="Moderate")  # Low, Moderate, High, Critical
    risk_category = Column(String(20), default="Moderate")
    reported_by = Column(String(100), default="Field Officer")
    affected_population = Column(Integer, default=0)
    estimated_damage = Column(String(150), default="Under Assessment")
    status = Column(String(30), default="Reported")  # Reported, Under Verification, Confirmed, Response Active, Monitoring, Resolved, Closed
    assigned_coordinator = Column(String(100), nullable=True)
    is_demo = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    updates = relationship("IncidentUpdate", back_populates="incident", cascade="all, delete-orphan")
    operations = relationship("RescueOperation", back_populates="incident")
    alerts = relationship("EmergencyAlert", back_populates="incident")


class IncidentUpdate(Base):
    __tablename__ = "incident_updates"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    update_text = Column(Text, nullable=False)
    updated_by = Column(String(100), nullable=False)
    previous_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("Incident", back_populates="updates")


# ==============================================================================
# 3. DISASTER ASSESSMENTS & RISK FACTORS
# ==============================================================================

class DisasterAssessment(Base):
    __tablename__ = "disaster_assessments"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(String(30), unique=True, index=True, nullable=False)
    disaster_type = Column(String(50), nullable=False)
    location_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=False)  # 0 to 100
    risk_category = Column(String(20), nullable=False)  # LOW, MODERATE, HIGH, VERY HIGH, CRITICAL
    input_data_json = Column(Text, nullable=False)  # Serialized JSON of inputs
    contributing_factors_json = Column(Text, nullable=False)  # Serialized JSON of breakdown
    explanation = Column(Text, nullable=False)
    suggested_precautions_json = Column(Text, nullable=False)
    data_quality = Column(String(20), default="Good")  # Preliminary, High, Verified
    assessment_type = Column(String(30), default="Rule-Based")
    is_demo = Column(Boolean, default=False)
    assessed_by = Column(String(100), default="Sentinel Intelligence Engine")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    factors = relationship("RiskFactor", back_populates="assessment", cascade="all, delete-orphan")


class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("disaster_assessments.id", ondelete="CASCADE"), nullable=False)
    factor_name = Column(String(100), nullable=False)
    factor_value = Column(String(100), nullable=False)
    weight = Column(Float, default=1.0)
    contribution_score = Column(Float, default=0.0)

    assessment = relationship("DisasterAssessment", back_populates="factors")


# ==============================================================================
# 4. LOCATIONS & GEOGRAPHIC ZONES
# ==============================================================================

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), default="Bihar")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation = Column(Float, default=0.0)
    population = Column(Integer, default=0)
    is_high_risk = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False)


class GeographicZone(Base):
    __tablename__ = "geographic_zones"

    id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String(150), nullable=False)
    zone_type = Column(String(50), nullable=False)  # High Risk Zone, Evacuation Zone, Safe Zone
    boundary_geojson = Column(Text, nullable=True)
    district = Column(String(100), nullable=False)
    is_demo = Column(Boolean, default=False)


# ==============================================================================
# 5. RESCUE TEAMS & OPERATIONS
# ==============================================================================

class RescueTeam(Base):
    __tablename__ = "rescue_teams"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String(30), unique=True, index=True, nullable=False)  # e.g., "TEAM-01"
    name = Column(String(100), nullable=False)
    team_type = Column(String(50), nullable=False)  # NDRF, SDRF, Medical Corps, Civil Defense, Fire & Rescue
    leader_name = Column(String(100), nullable=False)
    contact_number = Column(String(30), nullable=False)
    member_count = Column(Integer, default=10)
    equipment_summary = Column(String(255), default="Rescue boats, life vests, satellite comms")
    base_location = Column(String(150), nullable=False)
    status = Column(String(30), default="Available")  # Available, Assigned, Deployed, On Break, Unavailable
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    members = relationship("RescueMember", back_populates="team", cascade="all, delete-orphan")
    operations = relationship("RescueOperation", back_populates="team")


class RescueMember(Base):
    __tablename__ = "rescue_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("rescue_teams.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="Rescuer")
    contact = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True)

    team = relationship("RescueTeam", back_populates="members")


class RescueOperation(Base):
    __tablename__ = "rescue_operations"

    id = Column(Integer, primary_key=True, index=True)
    operation_id = Column(String(30), unique=True, index=True, nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    team_id = Column(Integer, ForeignKey("rescue_teams.id", ondelete="SET NULL"), nullable=True)
    priority = Column(String(20), default="High")  # Critical, High, Medium, Low
    objectives = Column(Text, nullable=False)
    status = Column(String(30), default="Planning")  # Planning, In Progress, Completed, Aborted
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    completion_time = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False)

    incident = relationship("Incident", back_populates="operations")
    team = relationship("RescueTeam", back_populates="operations")


class RescueAssignment(Base):
    __tablename__ = "rescue_assignments"

    id = Column(Integer, primary_key=True, index=True)
    operation_id = Column(Integer, ForeignKey("rescue_operations.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(Integer, ForeignKey("rescue_teams.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow)
    role_description = Column(String(200), default="Primary Search & Rescue")


# ==============================================================================
# 6. RESOURCES & INVENTORY
# ==============================================================================

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # Food, Drinking water, Medicines, Blankets, Boats, Vehicles, Fuel
    quantity = Column(Float, default=0.0)
    unit = Column(String(30), default="Units")  # Litres, Packets, Units, Kilograms
    storage_location = Column(String(150), nullable=False)
    available_quantity = Column(Float, default=0.0)
    reserved_quantity = Column(Float, default=0.0)
    deployed_quantity = Column(Float, default=0.0)
    condition = Column(String(50), default="Good")  # Good, Degraded, Needs Maintenance
    is_demo = Column(Boolean, default=False)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    transactions = relationship("ResourceTransaction", back_populates="resource")


class ResourceTransaction(Base):
    __tablename__ = "resource_transactions"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    transaction_type = Column(String(30), nullable=False)  # Allocation, Consumption, Restock, Return
    quantity = Column(Float, nullable=False)
    operation_id = Column(Integer, nullable=True)
    notes = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    resource = relationship("Resource", back_populates="transactions")


# ==============================================================================
# 7. SHELTERS & HOSPITALS
# ==============================================================================

class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    shelter_id = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    location_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_capacity = Column(Integer, default=500)
    current_occupancy = Column(Integer, default=0)
    contact_person = Column(String(100), default="Camp Manager")
    contact_number = Column(String(30), default="+91-9876543210")
    facilities_json = Column(Text, default='["Drinking Water", "First Aid", "Sanitation", "Power Backup"]')
    accessibility_info = Column(String(255), default="Accessible via NH-31 bypass")
    status = Column(String(30), default="Operational")  # Operational, Full, Closed
    is_demo = Column(Boolean, default=False)

    occupancy_logs = relationship("ShelterOccupancyLog", back_populates="shelter", cascade="all, delete-orphan")


class ShelterOccupancyLog(Base):
    __tablename__ = "shelter_occupancy_logs"

    id = Column(Integer, primary_key=True, index=True)
    shelter_id = Column(Integer, ForeignKey("shelters.id", ondelete="CASCADE"), nullable=False)
    delta_count = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, nullable=False)
    logged_at = Column(DateTime, default=datetime.datetime.utcnow)
    remarks = Column(String(255), nullable=True)

    shelter = relationship("Shelter", back_populates="occupancy_logs")


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    location_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_number = Column(String(30), default="+91-9876543220")
    emergency_dept_available = Column(Boolean, default=True)
    total_beds = Column(Integer, default=100)
    available_beds = Column(Integer, default=25)
    available_ambulances = Column(Integer, default=4)
    medical_facilities_json = Column(Text, default='["Trauma Care", "ICU", "Blood Bank", "Surgical Ward"]')
    status = Column(String(30), default="Operational")  # Operational, Overcrowded, Critical
    is_demo = Column(Boolean, default=False)

    availability_logs = relationship("HospitalAvailabilityLog", back_populates="hospital", cascade="all, delete-orphan")


class HospitalAvailabilityLog(Base):
    __tablename__ = "hospital_availability_logs"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    available_beds = Column(Integer, nullable=False)
    available_ambulances = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    hospital = relationship("Hospital", back_populates="availability_logs")


# ==============================================================================
# 8. EMERGENCY ALERTS
# ==============================================================================

class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(30), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    alert_type = Column(String(50), nullable=False)  # Flood warning, Heavy rainfall alert, Landslide warning, etc.
    severity = Column(String(20), default="High")  # Information, Low, Moderate, High, Critical
    message = Column(Text, nullable=False)
    location_name = Column(String(150), nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(30), default="Active")  # Active, Acknowledged, Resolved
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("Incident", back_populates="alerts")


# ==============================================================================
# 9. DATASETS & ML MODELS
# ==============================================================================

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    file_name = Column(String(150), nullable=False)
    file_format = Column(String(20), default="CSV")
    record_count = Column(Integer, default=0)
    columns_json = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    uploaded_by = Column(String(100), default="Analyst")
    data_quality_summary_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class DatasetImportLog(Base):
    __tablename__ = "dataset_import_logs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(30), default="Completed")
    rows_imported = Column(Integer, default=0)
    errors_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class MLModel(Base):
    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)
    version = Column(String(30), default="1.0.0")
    feature_names_json = Column(Text, nullable=False)
    metrics_json = Column(Text, nullable=True)
    limitations = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class MLTrainingRun(Base):
    __tablename__ = "ml_training_runs"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("ml_models.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(Integer, nullable=True)
    training_date = Column(DateTime, default=datetime.datetime.utcnow)
    parameters_json = Column(Text, nullable=True)
    metrics_json = Column(Text, nullable=True)


# ==============================================================================
# 10. AI CONVERSATIONS & MESSAGES
# ==============================================================================

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), default="Emergency AI Consultation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan")


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    model_name = Column(String(50), default="gemma4:e4b")
    execution_time_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("AIConversation", back_populates="messages")


# ==============================================================================
# 11. REPORTS & POST-DISASTER RECOVERY
# ==============================================================================

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(30), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    report_type = Column(String(50), nullable=False)  # Situation, Incident, Risk, Rescue, Resource, Shelter, Hospital, Recovery
    file_path = Column(String(255), nullable=True)
    file_format = Column(String(10), default="PDF")  # PDF, CSV, JSON
    parameters_json = Column(Text, nullable=True)
    generated_by = Column(String(100), default="Sentinel Administrator")
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class RecoveryProject(Base):
    __tablename__ = "recovery_projects"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(30), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    location_name = Column(String(150), nullable=False)
    infrastructure_type = Column(String(50), nullable=False)  # Roads, Bridges, Schools, Hospitals, Houses, Electricity, Water supply, Communication
    estimated_cost = Column(Float, default=0.0)
    actual_expenditure = Column(Float, default=0.0)
    status = Column(String(30), default="Planned")  # Not Started, Planned, In Progress, Completed, Delayed
    progress_percent = Column(Integer, default=0)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    tasks = relationship("RecoveryTask", back_populates="project", cascade="all, delete-orphan")


class RecoveryTask(Base):
    __tablename__ = "recovery_tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("recovery_projects.id", ondelete="CASCADE"), nullable=False)
    task_name = Column(String(200), nullable=False)
    assigned_to = Column(String(100), nullable=True)
    status = Column(String(30), default="Pending")
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    due_date = Column(DateTime, nullable=True)

    project = relationship("RecoveryProject", back_populates="tasks")


# ==============================================================================
# 12. AUDIT, FILES & SETTINGS
# ==============================================================================

class FileAttachment(Base):
    __tablename__ = "file_attachments"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)  # incident, assessment, report
    entity_id = Column(Integer, nullable=False)
    file_name = Column(String(200), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/octet-stream")
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    details_json = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="activity_logs")


class ApplicationSetting(Base):
    __tablename__ = "application_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(100), unique=True, index=True, nullable=False)
    setting_value = Column(Text, nullable=False)
    category = Column(String(50), default="General")
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

