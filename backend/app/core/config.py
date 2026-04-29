import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    app_name: str = "Personal AI Database Control Center"
    version: str = "1.0.0"
    database_root: Path = Path(os.getenv("DATABASE_ROOT", r"E:\DataBase"))
    database_api_base: str = os.getenv("DATABASE_API_BASE", "http://127.0.0.1:8765").rstrip("/")
    app_host: str = os.getenv("APP_HOST", "127.0.0.1")
    app_port: int = int(os.getenv("APP_PORT", "8876"))
    app_env: str = os.getenv("APP_ENV", "development")
    max_report_chars: int = int(os.getenv("MAX_REPORT_CHARS", "20000"))
    upstream_timeout: float = float(os.getenv("UPSTREAM_TIMEOUT", "4"))

    @property
    def backend_db_path(self) -> Path:
        return self.database_root / "runtime" / "db" / "sqlite" / "backend" / "backend_references.db"


settings = Settings()
