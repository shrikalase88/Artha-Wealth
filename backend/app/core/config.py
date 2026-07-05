"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "artha-wealth-backend"
    api_v1_prefix: str = "/api/v1"
    debug: bool = False

    database_url: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/artha",
    )

    supabase_url: str = "http://localhost:54321"
    supabase_service_role_key: str = "service-role-key"
    supabase_storage_bucket: str = "statements"

    llamaparse_api_key: str = ""
    mfapi_base_url: str = "https://api.mfapi.in/mf"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
