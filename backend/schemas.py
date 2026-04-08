from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from backend.database.models import ProcessingStatus, UserRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    role: UserRole
    department: str | None = None
    is_active: bool


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: UserRole
    department: str | None = None


class UserRegister(BaseModel):
    username: str
    password: str
    full_name: str
    role: UserRole
    department: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None
    department: str | None = None
    is_active: bool | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserRead | None = None


class MessageResponse(BaseModel):
    message: str


class PredictionTypeProbabilities(BaseModel):
    BACTERIAL: float | None = None
    VIRAL: float | None = None
    COVID: float | None = None


class PredictionTypeResult(BaseModel):
    label: str | None = None
    probs: PredictionTypeProbabilities | None = None


class PredictionResult(BaseModel):
    id: int
    task_id: str
    status: ProcessingStatus
    patient_name: str | None = None
    patient_age: int | None = None
    patient_gender: str | None = None
    technician_name: str | None = None
    performed_at: datetime | None = None
    prediction: str | None = None
    confidence: float | None = None
    original_url: str | None = None
    heatmap_url: str | None = None
    doctor_note: str | None = None
    doctor_confirmed: bool | None = None
    processing_time_ms: int | None = None
    created_at: datetime
    completed_at: datetime | None = None
    type: PredictionTypeResult | None = None


class NoteRequest(BaseModel):
    note: str


class ConfirmRequest(BaseModel):
    confirmed: bool


class PatientInfoRequest(BaseModel):
    patient_name: str | None = None
    patient_age: int | None = None
    patient_gender: str | None = None
    technician_name: str | None = None
    performed_at: datetime | None = None


class PaginatedPredictions(BaseModel):
    items: list[PredictionResult]
    total: int
    page: int


class BatchItemRead(BaseModel):
    id: int
    prediction_id: int | None
    filename: str
    status: ProcessingStatus
    queue_position: int | None = None
    error_message: str | None = None


class BatchProgressResponse(BaseModel):
    completed: int
    total: int
    items: list[BatchItemRead]


class BatchResponse(BaseModel):
    batch_id: int
    task_ids: list[str]


class AuditLogRead(BaseModel):
    id: int
    user_id: int | None
    action: str
    target_type: str
    target_id: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    detail: dict | None = None
    created_at: datetime


class PaginatedAuditLogs(BaseModel):
    items: list[AuditLogRead]
    total: int
    page: int


class PaginatedUsers(BaseModel):
    items: list[UserRead]
    total: int


class StaticAssetResponse(BaseModel):
    path: str
