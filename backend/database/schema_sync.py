from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_user_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    dialect = engine.dialect.name

    with engine.begin() as connection:
        if "email" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL"))

        connection.execute(
            text(
                "UPDATE users SET role = 'client' "
                "WHERE role IS NULL OR role NOT IN ('admin', 'client')"
            )
        )

        if dialect == "mysql":
            connection.execute(
                text(
                    "ALTER TABLE users "
                    "MODIFY COLUMN role ENUM('admin', 'client') NOT NULL DEFAULT 'client'"
                )
            )
