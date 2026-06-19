from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "smart_task_manager"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    ENVIRONMENT: str = "development"
    # "/api" for local dev; empty string on Vercel (Services adds /api routePrefix)
    API_PREFIX: str = "/api"

    class Config:
        env_file = ".env"

settings = Settings()
