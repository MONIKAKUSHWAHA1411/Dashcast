from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "dev-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    S3_ENDPOINT_URL: str = ""
    S3_BUCKET: str = "dashcast-reports"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""

    ANTHROPIC_API_KEY: str = ""

    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
