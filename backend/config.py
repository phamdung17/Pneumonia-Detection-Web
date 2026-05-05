from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_ENV_FILE = BASE_DIR / '.env'
FALLBACK_ENV_FILE = BASE_DIR / '.env.example'


def _to_sqlite_absolute_url(raw_url: str) -> str:
    prefix = 'sqlite:///'
    if not raw_url.startswith(prefix):
        return raw_url
    raw_path = raw_url[len(prefix):]
    if raw_path in {':memory:', ''}:
        return raw_url
    path_obj = Path(raw_path)
    if not path_obj.is_absolute():
        path_obj = (BASE_DIR.parent / path_obj).resolve()
    return f"sqlite:///{path_obj.as_posix()}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=DEFAULT_ENV_FILE if DEFAULT_ENV_FILE.exists() else FALLBACK_ENV_FILE,
        env_file_encoding='utf-8',
        extra='ignore',
    )

    app_name: str = 'Pneumonia Detection API'
    environment: str = 'development'
    debug: bool = True
    enable_mock_predict: bool = True

    mysql_host: str = 'localhost'
    mysql_port: int = 3306
    mysql_db: str = 'pneumonia_db'
    mysql_user: str = 'pneumonia_user'
    mysql_password: str = 'your_password'
    database_url: str | None = 'sqlite:///./backend/app.db'

    jwt_secret_key: str = 'change_me_to_a_random_32_char_secret'
    jwt_algorithm: str = 'HS256'
    jwt_access_expire_hours: int = 8
    jwt_refresh_expire_days: int = 30

    redis_url: str = 'redis://localhost:6379/0'
    upload_dir: str = str(BASE_DIR / 'uploads')
    max_file_size_mb: int = 10
    file_retention_hours: int = 24
    cors_origins: str = 'http://localhost:5173'
    task_timeout_seconds: int = 120

    @field_validator('debug', 'enable_mock_predict', mode='before')
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {'1', 'true', 'yes', 'on', 'debug', 'development'}:
                return True
            if lowered in {'0', 'false', 'no', 'off', 'release', 'prod', 'production'}:
                return False
        return bool(value)

    @computed_field  # type: ignore[misc]
    @property
    def sqlalchemy_database_uri(self) -> str:
        if self.database_url:
            return _to_sqlite_absolute_url(self.database_url)
        return (
            f'mysql+pymysql://{self.mysql_user}:{self.mysql_password}'
            f'@{self.mysql_host}:{self.mysql_port}/{self.mysql_db}'
        )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(',') if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
