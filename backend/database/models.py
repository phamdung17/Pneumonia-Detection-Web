from __future__ import annotations

import enum
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database.connection import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class UserRole(str, enum.Enum):
    admin = "admin"
    doctor = "doctor"
    technician = "technician"


class PredictionLabel(str, enum.Enum):
    normal = "NORMAL"
    pneumonia = "PNEUMONIA"


class EnsembleStatus(str, enum.Enum):
    confirmed = "CONFIRMED"
    suspected = "SUSPECTED"


class DiseaseType(str, enum.Enum):
    bacterial = "BACTERIAL"
    viral = "VIRAL"
    covid = "COVID"
    none = "NONE"


class ProcessingStatus(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    done = "done"
    failed = "failed"


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.technician, nullable=False)
    department: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    failed_login_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime)
    last_login: Mapped[datetime | None] = mapped_column(DateTime)

    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user")
    predictions: Mapped[list["Prediction"]] = relationship(back_populates="user")
    batch_jobs: Mapped[list["BatchJob"]] = relationship(back_populates="user")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="user")


class RefreshToken(TimestampMixin, Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime)

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")


class Prediction(TimestampMixin, Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    task_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    patient_name: Mapped[str | None] = mapped_column(String(255))
    patient_age: Mapped[int | None] = mapped_column(Integer)
    patient_gender: Mapped[str | None] = mapped_column(String(32))
    technician_name: Mapped[str | None] = mapped_column(String(255))
    performed_at: Mapped[datetime | None] = mapped_column(DateTime)
    prediction: Mapped[PredictionLabel | None] = mapped_column(Enum(PredictionLabel))
    ensemble_status: Mapped[EnsembleStatus | None] = mapped_column(Enum(EnsembleStatus))
    confidence: Mapped[float | None] = mapped_column(Float)
    prob_dn: Mapped[float | None] = mapped_column(Float)
    prob_eff: Mapped[float | None] = mapped_column(Float)
    disease_type: Mapped[DiseaseType | None] = mapped_column(Enum(DiseaseType))
    bacterial_prob: Mapped[float | None] = mapped_column(Float)
    viral_prob: Mapped[float | None] = mapped_column(Float)
    covid_prob: Mapped[float | None] = mapped_column(Float)
    lesion_pct: Mapped[float | None] = mapped_column(Float)
    bbox_x1: Mapped[int | None] = mapped_column(Integer)
    bbox_y1: Mapped[int | None] = mapped_column(Integer)
    bbox_x2: Mapped[int | None] = mapped_column(Integer)
    bbox_y2: Mapped[int | None] = mapped_column(Integer)
    dice_score: Mapped[float | None] = mapped_column(Float)
    heatmap_dn_path: Mapped[str | None] = mapped_column(String(500))
    heatmap_eff_path: Mapped[str | None] = mapped_column(String(500))
    lung_mask_path: Mapped[str | None] = mapped_column(String(500))
    doctor_note: Mapped[str | None] = mapped_column(Text)
    doctor_confirmed: Mapped[bool | None] = mapped_column(Boolean)
    status: Mapped[ProcessingStatus] = mapped_column(Enum(ProcessingStatus), default=ProcessingStatus.queued, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)
    processing_time_ms: Mapped[int | None] = mapped_column(Integer)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    user: Mapped["User"] = relationship(back_populates="predictions")
    batch_items: Mapped[list["BatchItem"]] = relationship(back_populates="prediction")


class BatchJob(TimestampMixin, Base):
    __tablename__ = "batch_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    job_name: Mapped[str] = mapped_column(String(255), nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    completed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[ProcessingStatus] = mapped_column(Enum(ProcessingStatus), default=ProcessingStatus.queued, nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime)

    user: Mapped["User"] = relationship(back_populates="batch_jobs")
    items: Mapped[list["BatchItem"]] = relationship(back_populates="batch", cascade="all, delete-orphan")


class BatchItem(Base):
    __tablename__ = "batch_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batch_jobs.id"), nullable=False, index=True)
    prediction_id: Mapped[int | None] = mapped_column(ForeignKey("predictions.id"), index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[ProcessingStatus] = mapped_column(Enum(ProcessingStatus), default=ProcessingStatus.queued, nullable=False)
    queue_position: Mapped[int | None] = mapped_column(Integer)
    error_message: Mapped[str | None] = mapped_column(Text)

    batch: Mapped["BatchJob"] = relationship(back_populates="items")
    prediction: Mapped["Prediction | None"] = relationship(back_populates="batch_items")


class AuditLog(TimestampMixin, Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[str | None] = mapped_column(String(100))
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(255))
    detail: Mapped[dict[str, Any] | None] = mapped_column(JSON)

    user: Mapped["User | None"] = relationship(back_populates="audit_logs")
