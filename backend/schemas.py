from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from backend.database.models import DiseaseType, EnsembleStatus, PredictionLabel, ProcessingStatus, UserRole


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


class PredictionStage1(BaseModel):
    prediction: PredictionLabel | None = None
    ensemble_status: EnsembleStatus | None = None
    confidence: float | None = None
    prob_dn: float | None = None
    prob_eff: float | None = None


class PredictionStage2(BaseModel):
    disease_type: DiseaseType | None = None
    bacterial_prob: float | None = None
    viral_prob: float | None = None
    covid_prob: float | None = None


class VisualizationBBox(BaseModel):
    x1: int | None = None
    y1: int | None = None
    x2: int | None = None
    y2: int | None = None


class PredictionVisualization(BaseModel):
    heatmap_dn_url: str | None = None
    heatmap_eff_url: str | None = None
    lung_mask_url: str | None = None
    bbox: VisualizationBBox
    lesion_pct: float | None = None


class PredictionResult(BaseModel):
    id: int
    task_id: str
    status: ProcessingStatus
    created_at: datetime
    completed_at: datetime | None = None
    processing_time_ms: int | None = None
    stage1: PredictionStage1
    stage2: PredictionStage2
    visualization: PredictionVisualization
    doctor_note: str | None = None
    doctor_confirmed: bool | None = None


class NoteRequest(BaseModel):
    note: str


class ConfirmRequest(BaseModel):
    confirmed: bool


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
