from __future__ import annotations

from datetime import datetime

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.database.models import ProcessingStatus, UserRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: datetime | None = None


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: UserRole

    @field_validator('password')
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password_strength(value)

    @field_validator('email')
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password_strength(value)

    @field_validator('email')
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


class UserUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


class ForgotPasswordResponse(BaseModel):
    message: str
    reset_token: str
    reset_url: str
    expires_in_minutes: int


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password_strength(value)


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password_strength(value)


class ProfileUpdateRequest(BaseModel):
    current_password: str
    full_name: str = Field(min_length=2, max_length=255)
    email: str
    phone: str | None = None
    avatar_url: str | None = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is None or value == '':
            return None
        normalized = value.strip()
        if not re.fullmatch(r'(0|\+84)\d{9,10}', normalized):
            raise ValueError('Phone number is invalid')
        return normalized

    @field_validator('email')
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserRead | None = None


class MessageResponse(BaseModel):
    message: str


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
    probability: float | None = None
    original_url: str | None = None
    heatmap_url: str | None = None
    doctor_note: str | None = None
    doctor_confirmed: bool | None = None
    processing_time_ms: int | None = None
    created_at: datetime
    completed_at: datetime | None = None


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


class AuditLogRead(BaseModel):
    id: int
    user_id: int | None
    action: str
    target_type: str
    target_id: str | None = None
    target_display: str
    ip_address: str | None = None
    user_agent: str | None = None
    detail: dict | None = None
    created_at: datetime
    created_at_local: str


class PaginatedAuditLogs(BaseModel):
    items: list[AuditLogRead]
    total: int
    page: int


class PaginatedUsers(BaseModel):
    items: list[UserRead]
    total: int


class StaticAssetResponse(BaseModel):
    path: str


class AdminDashboardSummary(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    total_predictions: int
    done_predictions: int
    failed_predictions: int


class AuditLogFilters(BaseModel):
    search: str | None = None
    action: str | None = None
    user_id: int | None = None


def _validate_password_strength(value: str) -> str:
    if len(value) < 8:
        raise ValueError('Password must be at least 8 characters long')
    if not any(char.isupper() for char in value):
        raise ValueError('Password must contain at least one uppercase letter')
    if not any(char.islower() for char in value):
        raise ValueError('Password must contain at least one lowercase letter')
    if not any(char.isdigit() for char in value):
        raise ValueError('Password must contain at least one digit')
    if not any(not char.isalnum() for char in value):
        raise ValueError('Password must contain at least one special character')
    return value


def _validate_email(value: str) -> str:
    normalized = value.strip()
    if not re.fullmatch(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', normalized):
        raise ValueError('Email is invalid')
    return normalized
