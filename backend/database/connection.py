from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

try:
    # Try relative import first (when imported as package)
    from ..config import get_settings
except ImportError:
    try:
        # Then try absolute import (when run directly)
        from config import get_settings
    except ImportError:
        # Last resort: local import
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from config import get_settings


settings = get_settings()


class Base(DeclarativeBase):
    pass


connect_args = {}
database_uri = settings.sqlalchemy_database_uri
if database_uri.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(database_uri, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=Session)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
