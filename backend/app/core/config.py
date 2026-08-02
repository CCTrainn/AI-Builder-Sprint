from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Work Rights Companion API"
    app_env: str = "local"
    upstage_api_key: str = ""
    llm_api_key: str = ""
    law_api_oc: str = ""
    max_upload_bytes: int = 10 * 1024 * 1024
    local_data_dir: Path = Path(__file__).resolve().parents[2] / "local_data"
    local_db_name: str = "work-rights.db"
    local_upload_dir_name: str = "uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()
