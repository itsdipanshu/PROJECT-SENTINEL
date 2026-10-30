import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATABASE_DIR = DATA_DIR / "database"
DATASETS_DIR = DATA_DIR / "datasets"
GEOJSON_DIR = DATA_DIR / "geojson"
REPORTS_DIR = DATA_DIR / "reports"
UPLOADS_DIR = DATA_DIR / "uploads"

# Ensure directories exist
for path in [DATABASE_DIR, DATASETS_DIR, GEOJSON_DIR, REPORTS_DIR, UPLOADS_DIR]:
    path.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    PROJECT_NAME: str = "PROJECT SENTINEL"
    PROJECT_TAGLINE: str = "Disaster Intelligence Network"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_PATH: Path = DATABASE_DIR / "sentinel.db"
    DATABASE_URL: str = f"sqlite:///{DATABASE_PATH}"

    # Security
    SECRET_KEY: str = "sentinel_emergency_secret_key_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours local session

    # Local AI Settings
    DEFAULT_OLLAMA_MODEL: str = "gemma4:e4b"
    OLLAMA_TIMEOUT_SECONDS: int = 120
    OLLAMA_CLI_COMMAND: str = "ollama"

    # Paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = DATA_DIR
    DATABASE_DIR: Path = DATABASE_DIR
    DATASETS_DIR: Path = DATASETS_DIR
    GEOJSON_DIR: Path = GEOJSON_DIR
    REPORTS_DIR: Path = REPORTS_DIR
    UPLOADS_DIR: Path = UPLOADS_DIR

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

