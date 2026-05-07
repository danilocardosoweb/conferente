from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    APP_NAME: str = "Conferente - Contador de Perfis"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Banco de dados SQLite local
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR}/conferente.db"

    # CORS - aceita o frontend Next.js
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    # Parâmetros padrão do detector de perfis
    DEFAULT_MIN_RADIUS: int = 8
    DEFAULT_MAX_RADIUS: int = 80
    DEFAULT_CANNY_LOW: int = 30
    DEFAULT_CANNY_HIGH: int = 100
    DEFAULT_HOUGH_PARAM1: int = 50
    DEFAULT_HOUGH_PARAM2: int = 25
    DEFAULT_MIN_DIST: int = 20

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
