from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: str

    REDIS_URL: str
    JWT_SECRET: str
    GEMINI_API_KEY: str
    ORCHESTRATOR_URL: str

    LOG_LEVEL: str = "INFO"
    PORT: int = 8080

    class Config:
        env_file = ".env"


settings = Settings()
