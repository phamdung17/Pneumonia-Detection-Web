from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from backend.config import get_settings


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
