from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_split_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if not tables:
        return

    dialect = engine.dialect.name

    expected_columns: dict[str, dict[str, str]] = {
        "users": {
            "role": _enum_sql(dialect, ["admin", "client"], default="client"),
            "is_active": _boolean_sql(dialect, default=True),
            "created_at": _datetime_sql(dialect),
        },
        "user_profiles": {
            "full_name": "VARCHAR(255) NOT NULL",
            "email": "VARCHAR(255) NULL",
            "phone": "VARCHAR(20) NULL",
            "avatar_url": "VARCHAR(500) NULL",
            "created_at": _datetime_sql(dialect),
        },
        "user_security_logs": {
            "failed_login_count": "INTEGER NOT NULL DEFAULT 0",
            "locked_until": "DATETIME NULL",
            "last_login": "DATETIME NULL",
            "created_at": _datetime_sql(dialect),
        },
        "predictions": {
            "status": _enum_sql(dialect, ["queued", "processing", "done", "failed"], default="queued"),
            "created_at": _datetime_sql(dialect),
        },
        "prediction_patient_info": {
            "patient_name": "VARCHAR(255) NULL",
            "patient_age": "INTEGER NULL",
            "patient_gender": "VARCHAR(32) NULL",
            "technician_name": "VARCHAR(255) NULL",
            "performed_at": "DATETIME NULL",
            "created_at": _datetime_sql(dialect),
        },
        "prediction_results": {
            "prediction": _enum_sql(dialect, ["normal", "pneumonia"]),
            "ensemble_status": _enum_sql(dialect, ["confirmed", "suspected"]),
            "confidence": "FLOAT NULL",
            "prob_dn": "FLOAT NULL",
            "prob_eff": "FLOAT NULL",
            "disease_type": _enum_sql(dialect, ["bacterial", "viral", "covid", "none"]),
            "bacterial_prob": "FLOAT NULL",
            "viral_prob": "FLOAT NULL",
            "covid_prob": "FLOAT NULL",
            "created_at": _datetime_sql(dialect),
        },
        "prediction_analysis": {
            "lesion_pct": "FLOAT NULL",
            "bbox_x1": "INTEGER NULL",
            "bbox_y1": "INTEGER NULL",
            "bbox_x2": "INTEGER NULL",
            "bbox_y2": "INTEGER NULL",
            "dice_score": "FLOAT NULL",
            "heatmap_dn_path": "VARCHAR(500) NULL",
            "heatmap_eff_path": "VARCHAR(500) NULL",
            "lung_mask_path": "VARCHAR(500) NULL",
            "created_at": _datetime_sql(dialect),
        },
        "prediction_doctor_review": {
            "doctor_note": "TEXT NULL",
            "doctor_confirmed": _boolean_sql(dialect, default=False),
            "reviewed_at": "DATETIME NULL",
            "created_at": _datetime_sql(dialect),
        },
        "prediction_processing_log": {
            "error_message": "TEXT NULL",
            "processing_time_ms": "INTEGER NULL",
            "completed_at": "DATETIME NULL",
            "created_at": _datetime_sql(dialect),
        },
    }

    with engine.begin() as connection:
        for table_name, columns in expected_columns.items():
            if table_name not in tables:
                continue

            existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
            for column_name, column_sql in columns.items():
                if column_name in existing_columns:
                    continue
                connection.execute(
                    text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_sql}")
                )

        if "users" in tables:
            connection.execute(
                text(
                    "UPDATE users SET role = 'client' "
                    "WHERE role IS NULL OR role NOT IN ('admin', 'client')"
                )
            )

        _normalize_prediction_result_enums(connection, inspector, dialect, tables)


def _enum_sql(dialect: str, values: list[str], default: str | None = None) -> str:
    if dialect == "mysql":
        enum_values = ", ".join(f"'{value}'" for value in values)
        default_sql = f" DEFAULT '{default}'" if default is not None else ""
        return f"ENUM({enum_values}) NULL{default_sql}"
    # SQLite does not support native ENUM, so keep it flexible.
    default_sql = f" DEFAULT '{default}'" if default is not None else ""
    return f"VARCHAR(32) NULL{default_sql}"


def _boolean_sql(dialect: str, default: bool | None = None) -> str:
    default_sql = ""
    if default is not None:
        if dialect == "mysql":
            default_sql = f" DEFAULT {1 if default else 0}"
        else:
            default_sql = f" DEFAULT {1 if default else 0}"
    return f"BOOLEAN NOT NULL{default_sql}"


def _datetime_sql(dialect: str) -> str:
    if dialect == "mysql":
        return "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
    return "DATETIME NULL"


def _normalize_prediction_result_enums(connection, inspector, dialect: str, tables: set[str]) -> None:
    if dialect != "mysql" or "prediction_results" not in tables:
        return

    column_map = {column["name"]: column for column in inspector.get_columns("prediction_results")}
    prediction_column = column_map.get("prediction")
    if prediction_column is None:
        return

    prediction_type = str(prediction_column["type"]).lower()
    if "'normal'" in prediction_type and "'pneumonia'" in prediction_type:
        return

    connection.execute(
        text(
            "ALTER TABLE prediction_results "
            "MODIFY COLUMN prediction ENUM('normal', 'pneumonia') NULL"
        )
    )
