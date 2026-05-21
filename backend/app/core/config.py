import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vision AI - Classroom Monitoring"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_CHANGE_ME")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017")
    DATABASE_NAME: str = "engagement-analysis"

settings = Settings()
