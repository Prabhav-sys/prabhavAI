from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "prabhavAI AI Service"
    app_env: Literal["development", "test", "production"] = "development"
    app_host: str = "127.0.0.1"
    app_port: int = Field(default=8001, ge=1, le=65535)
    api_prefix: str = "/api/v1"
    log_level: str = "INFO"
    internal_api_key: SecretStr | None = None

    groq_api_key: SecretStr | None = None
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_model: str = "openai/gpt-oss-120b"
    groq_timeout_seconds: float = Field(default=60, gt=0, le=180)

    qdrant_url: str | None = None
    qdrant_api_key: SecretStr | None = None
    qdrant_collection: str = "prabhavai_resume_chunks"

    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dimension: int = Field(default=384, gt=0)

    tavily_api_key: SecretStr | None = None
    tavily_max_results: int = Field(default=5, ge=1, le=10)

    weaviate_enabled: bool = False
    weaviate_url: str | None = None
    weaviate_api_key: SecretStr | None = None

    max_upload_size_mb: int = Field(default=5, ge=1, le=20)
    max_pdf_pages: int = Field(default=40, ge=1, le=200)
    chunk_size: int = Field(default=1200, ge=200, le=5000)
    chunk_overlap: int = Field(default=180, ge=0, le=1000)

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    @model_validator(mode="after")
    def validate_runtime_secrets(self):
        if self.app_env == "production" and not self.internal_api_key:
            raise ValueError("INTERNAL_API_KEY is required in production")
        if self.weaviate_enabled and not (self.weaviate_url and self.weaviate_api_key):
            raise ValueError("WEAVIATE_URL and WEAVIATE_API_KEY are required when enabled")
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
