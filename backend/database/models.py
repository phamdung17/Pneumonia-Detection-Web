from __future__ import annotations

import enum
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

try:
    from .connection import Base
except ImportError:
    from connection import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class UserRole(str, enum.Enum):
    admin = "admin"
    client = "client"


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


# ============================================================================
# PHƯƠNG ÁN 2: TÁCH BẢNG USERS
# ============================================================================

class User(TimestampMixin, Base):
    """Bảng xác thực - chỉ giữ thông tin đăng nhập"""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.client, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user_profile: Mapped["UserProfile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    user_security_log: Mapped["UserSecurityLog"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    predictions: Mapped[list["Prediction"]] = relationship(back_populates="user")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="user")

    @property
    def full_name(self) -> str:
        return self.user_profile.full_name if self.user_profile else ""

    @full_name.setter
    def full_name(self, value: str) -> None:
        if self.user_profile is None:
            self.user_profile = UserProfile(full_name=value)
        else:
            self.user_profile.full_name = value

    @property
    def email(self) -> str | None:
        return self.user_profile.email if self.user_profile else None

    @email.setter
    def email(self, value: str | None) -> None:
        if self.user_profile is None:
            self.user_profile = UserProfile(full_name=self.username, email=value)
        else:
            self.user_profile.email = value

    @property
    def phone(self) -> str | None:
        return self.user_profile.phone if self.user_profile else None

    @phone.setter
    def phone(self, value: str | None) -> None:
        if self.user_profile is None:
            self.user_profile = UserProfile(full_name=self.username, phone=value)
        else:
            self.user_profile.phone = value

    @property
    def avatar_url(self) -> str | None:
        return self.user_profile.avatar_url if self.user_profile else None

    @avatar_url.setter
    def avatar_url(self, value: str | None) -> None:
        if self.user_profile is None:
            self.user_profile = UserProfile(full_name=self.username, avatar_url=value)
        else:
            self.user_profile.avatar_url = value

    @property
    def failed_login_count(self) -> int:
        return self.user_security_log.failed_login_count if self.user_security_log else 0

    @failed_login_count.setter
    def failed_login_count(self, value: int) -> None:
        if self.user_security_log is None:
            self.user_security_log = UserSecurityLog(failed_login_count=value)
        else:
            self.user_security_log.failed_login_count = value

    @property
    def locked_until(self) -> datetime | None:
        return self.user_security_log.locked_until if self.user_security_log else None

    @locked_until.setter
    def locked_until(self, value: datetime | None) -> None:
        if self.user_security_log is None:
            self.user_security_log = UserSecurityLog(locked_until=value)
        else:
            self.user_security_log.locked_until = value

    @property
    def last_login(self) -> datetime | None:
        return self.user_security_log.last_login if self.user_security_log else None

    @last_login.setter
    def last_login(self, value: datetime | None) -> None:
        if self.user_security_log is None:
            self.user_security_log = UserSecurityLog(last_login=value)
        else:
            self.user_security_log.last_login = value


class UserProfile(TimestampMixin, Base):
    """Bảng thông tin cá nhân người dùng"""
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), index=True)
    phone: Mapped[str | None] = mapped_column(String(20), index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="user_profile")


class UserSecurityLog(TimestampMixin, Base):
    """Bảng ghi nhận bảo mật người dùng"""
    __tablename__ = "user_security_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False, index=True)
    failed_login_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime)
    last_login: Mapped[datetime | None] = mapped_column(DateTime)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="user_security_log")


class RefreshToken(TimestampMixin, Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime)

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")


class PasswordResetToken(TimestampMixin, Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime)

    user: Mapped["User"] = relationship(back_populates="password_reset_tokens")


# ============================================================================
# PHƯƠNG ÁN 1: TÁCH BẢNG PREDICTIONS
# ============================================================================

class Prediction(TimestampMixin, Base):
    """Bảng dự đoán chính - core information"""
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    task_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[ProcessingStatus] = mapped_column(Enum(ProcessingStatus), default=ProcessingStatus.queued, nullable=False, index=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="predictions")
    patient_info: Mapped["PredictionPatientInfo"] = relationship(back_populates="parent_prediction", uselist=False, cascade="all, delete-orphan")
    results: Mapped["PredictionResults"] = relationship(back_populates="parent_prediction", uselist=False, cascade="all, delete-orphan")
    analysis: Mapped["PredictionAnalysis"] = relationship(back_populates="parent_prediction", uselist=False, cascade="all, delete-orphan")
    doctor_review: Mapped["PredictionDoctorReview"] = relationship(back_populates="parent_prediction", uselist=False, cascade="all, delete-orphan")
    processing_log: Mapped["PredictionProcessingLog"] = relationship(back_populates="parent_prediction", uselist=False, cascade="all, delete-orphan")

    @property
    def patient_name(self) -> str | None:
        return self.patient_info.patient_name if self.patient_info else None

    @patient_name.setter
    def patient_name(self, value: str | None) -> None:
        if self.patient_info is None:
            self.patient_info = PredictionPatientInfo(patient_name=value)
        else:
            self.patient_info.patient_name = value

    @property
    def patient_age(self) -> int | None:
        return self.patient_info.patient_age if self.patient_info else None

    @patient_age.setter
    def patient_age(self, value: int | None) -> None:
        if self.patient_info is None:
            self.patient_info = PredictionPatientInfo(patient_age=value)
        else:
            self.patient_info.patient_age = value

    @property
    def patient_gender(self) -> str | None:
        return self.patient_info.patient_gender if self.patient_info else None

    @patient_gender.setter
    def patient_gender(self, value: str | None) -> None:
        if self.patient_info is None:
            self.patient_info = PredictionPatientInfo(patient_gender=value)
        else:
            self.patient_info.patient_gender = value

    @property
    def technician_name(self) -> str | None:
        return self.patient_info.technician_name if self.patient_info else None

    @technician_name.setter
    def technician_name(self, value: str | None) -> None:
        if self.patient_info is None:
            self.patient_info = PredictionPatientInfo(technician_name=value)
        else:
            self.patient_info.technician_name = value

    @property
    def performed_at(self) -> datetime | None:
        return self.patient_info.performed_at if self.patient_info else None

    @performed_at.setter
    def performed_at(self, value: datetime | None) -> None:
        if self.patient_info is None:
            self.patient_info = PredictionPatientInfo(performed_at=value)
        else:
            self.patient_info.performed_at = value

    @property
    def prediction(self) -> "PredictionLabel | None":
        return self.results.prediction if self.results else None

    @prediction.setter
    def prediction(self, value: "PredictionLabel | None") -> None:
        if self.results is None:
            self.results = PredictionResults(prediction=value)
        else:
            self.results.prediction = value

    @property
    def ensemble_status(self) -> "EnsembleStatus | None":
        return self.results.ensemble_status if self.results else None

    @ensemble_status.setter
    def ensemble_status(self, value: "EnsembleStatus | None") -> None:
        if self.results is None:
            self.results = PredictionResults(ensemble_status=value)
        else:
            self.results.ensemble_status = value

    @property
    def confidence(self) -> float | None:
        return self.results.confidence if self.results else None

    @confidence.setter
    def confidence(self, value: float | None) -> None:
        if self.results is None:
            self.results = PredictionResults(confidence=value)
        else:
            self.results.confidence = value

    @property
    def prob_dn(self) -> float | None:
        return self.results.prob_dn if self.results else None

    @prob_dn.setter
    def prob_dn(self, value: float | None) -> None:
        if self.results is None:
            self.results = PredictionResults(prob_dn=value)
        else:
            self.results.prob_dn = value

    @property
    def prob_eff(self) -> float | None:
        return self.results.prob_eff if self.results else None

    @prob_eff.setter
    def prob_eff(self, value: float | None) -> None:
        if self.results is None:
            self.results = PredictionResults(prob_eff=value)
        else:
            self.results.prob_eff = value

    @property
    def disease_type(self) -> "DiseaseType | None":
        return self.results.disease_type if self.results else None

    @disease_type.setter
    def disease_type(self, value: "DiseaseType | None") -> None:
        if self.results is None:
            self.results = PredictionResults(disease_type=value)
        else:
            self.results.disease_type = value

    @property
    def bacterial_prob(self) -> float | None:
        return self.results.bacterial_prob if self.results else None

    @bacterial_prob.setter
    def bacterial_prob(self, value: float | None) -> None:
        if self.results is None:
            self.results = PredictionResults(bacterial_prob=value)
        else:
            self.results.bacterial_prob = value

    @property
    def viral_prob(self) -> float | None:
        return self.results.viral_prob if self.results else None

    @viral_prob.setter
    def viral_prob(self, value: float | None) -> None:
        if self.results is None:
            self.results = PredictionResults(viral_prob=value)
        else:
            self.results.viral_prob = value

    @property
    def covid_prob(self) -> float | None:
        return self.results.covid_prob if self.results else None

    @covid_prob.setter
    def covid_prob(self, value: float | None) -> None:
        if self.results is None:
            self.results = PredictionResults(covid_prob=value)
        else:
            self.results.covid_prob = value

    @property
    def lesion_pct(self) -> float | None:
        return self.analysis.lesion_pct if self.analysis else None

    @lesion_pct.setter
    def lesion_pct(self, value: float | None) -> None:
        if self.analysis is None:
            self.analysis = PredictionAnalysis(lesion_pct=value)
        else:
            self.analysis.lesion_pct = value

    @property
    def bbox_x1(self) -> int | None:
        return self.analysis.bbox_x1 if self.analysis else None

    @bbox_x1.setter
    def bbox_x1(self, value: int | None) -> None:
        if self.analysis is None:
            self.analysis = PredictionAnalysis(bbox_x1=value)
        else:
            self.analysis.bbox_x1 = value

    @property
    def bbox_y1(self) -> int | None:
        return self.analysis.bbox_y1 if self.analysis else None

    @bbox_y1.setter
    def bbox_y1(self, value: int | None) -> None:
        if self.analysis is None:
            self.analysis = PredictionAnalysis(bbox_y1=value)
        else:
            self.analysis.bbox_y1 = value

    @property
    def bbox_x2(self) -> int | None:
        return self.analysis.bbox_x2 if self.analysis else None

    @bbox_x2.setter
    def bbox_x2(self, value: int | None) -> None:
        if self.analysis is None:
            self.analysis = PredictionAnalysis(bbox_x2=value)
        else:
            self.analysis.bbox_x2 = value

    @property
    def bbox_y2(self) -> int | None:
        return self.analysis.bbox_y2 if self.analysis else None

    @bbox_y2.setter
    def bbox_y2(self, value: int | None) -> None:
        if self.analysis is None:
            self.analysis = PredictionAnalysis(bbox_y2=value)
        else:
            self.analysis.bbox_y2 = value

    @property
    def dice_score(self) -> float | None:
        return self.analysis.dice_score if self.analysis else None

    @dice_score.setter
    def dice_score(self, value: float | None) -> None:
        if self.analysis is None:
            self.analysis = PredictionAnalysis(dice_score=value)
        else:
            self.analysis.dice_score = value

    @property
    def heatmap_dn_path(self) -> str | None:
        return self.analysis.heatmap_dn_path if self.analysis else None

    @heatmap_dn_path.setter
    def heatmap_dn_path(self, value: str | None) -> None:
        if self.analysis is None:
            self.analysis = PredictionAnalysis(heatmap_dn_path=value)
        else:
            self.analysis.heatmap_dn_path = value

    @property
    def heatmap_eff_path(self) -> str | None:
        return self.analysis.heatmap_eff_path if self.analysis else None

    @heatmap_eff_path.setter
    def heatmap_eff_path(self, value: str | None) -> None:
        if self.analysis is None:
            self.analysis = PredictionAnalysis(heatmap_eff_path=value)
        else:
            self.analysis.heatmap_eff_path = value

    @property
    def lung_mask_path(self) -> str | None:
        return self.analysis.lung_mask_path if self.analysis else None

    @lung_mask_path.setter
    def lung_mask_path(self, value: str | None) -> None:
        if self.analysis is None:
            self.analysis = PredictionAnalysis(lung_mask_path=value)
        else:
            self.analysis.lung_mask_path = value

    @property
    def doctor_note(self) -> str | None:
        return self.doctor_review.doctor_note if self.doctor_review else None

    @doctor_note.setter
    def doctor_note(self, value: str | None) -> None:
        if self.doctor_review is None:
            self.doctor_review = PredictionDoctorReview(doctor_note=value)
        else:
            self.doctor_review.doctor_note = value

    @property
    def doctor_confirmed(self) -> bool | None:
        return self.doctor_review.doctor_confirmed if self.doctor_review else None

    @doctor_confirmed.setter
    def doctor_confirmed(self, value: bool | None) -> None:
        if self.doctor_review is None:
            self.doctor_review = PredictionDoctorReview(doctor_confirmed=value)
        else:
            self.doctor_review.doctor_confirmed = value

    @property
    def error_message(self) -> str | None:
        return self.processing_log.error_message if self.processing_log else None

    @error_message.setter
    def error_message(self, value: str | None) -> None:
        if self.processing_log is None:
            self.processing_log = PredictionProcessingLog(error_message=value)
        else:
            self.processing_log.error_message = value

    @property
    def processing_time_ms(self) -> int | None:
        return self.processing_log.processing_time_ms if self.processing_log else None

    @processing_time_ms.setter
    def processing_time_ms(self, value: int | None) -> None:
        if self.processing_log is None:
            self.processing_log = PredictionProcessingLog(processing_time_ms=value)
        else:
            self.processing_log.processing_time_ms = value

    @property
    def completed_at(self) -> datetime | None:
        return self.processing_log.completed_at if self.processing_log else None

    @completed_at.setter
    def completed_at(self, value: datetime | None) -> None:
        if self.processing_log is None:
            self.processing_log = PredictionProcessingLog(completed_at=value)
        else:
            self.processing_log.completed_at = value


class PredictionPatientInfo(TimestampMixin, Base):
    """Bảng thông tin bệnh nhân"""
    __tablename__ = "prediction_patient_info"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(ForeignKey("predictions.id"), unique=True, nullable=False, index=True)
    patient_name: Mapped[str | None] = mapped_column(String(255))
    patient_age: Mapped[int | None] = mapped_column(Integer)
    patient_gender: Mapped[str | None] = mapped_column(String(32))
    technician_name: Mapped[str | None] = mapped_column(String(255))
    performed_at: Mapped[datetime | None] = mapped_column(DateTime)

    # Relationships
    parent_prediction: Mapped["Prediction"] = relationship(back_populates="patient_info")


class PredictionResults(TimestampMixin, Base):
    """Bảng kết quả dự đoán"""
    __tablename__ = "prediction_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(ForeignKey("predictions.id"), unique=True, nullable=False, index=True)
    prediction: Mapped[PredictionLabel | None] = mapped_column(Enum(PredictionLabel))
    ensemble_status: Mapped[EnsembleStatus | None] = mapped_column(Enum(EnsembleStatus))
    confidence: Mapped[float | None] = mapped_column(Float)
    prob_dn: Mapped[float | None] = mapped_column(Float)
    prob_eff: Mapped[float | None] = mapped_column(Float)
    disease_type: Mapped[DiseaseType | None] = mapped_column(Enum(DiseaseType))
    bacterial_prob: Mapped[float | None] = mapped_column(Float)
    viral_prob: Mapped[float | None] = mapped_column(Float)
    covid_prob: Mapped[float | None] = mapped_column(Float)

    # Relationships
    parent_prediction: Mapped["Prediction"] = relationship(back_populates="results")


class PredictionAnalysis(TimestampMixin, Base):
    """Bảng phân tích hình ảnh"""
    __tablename__ = "prediction_analysis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(ForeignKey("predictions.id"), unique=True, nullable=False, index=True)
    lesion_pct: Mapped[float | None] = mapped_column(Float)
    bbox_x1: Mapped[int | None] = mapped_column(Integer)
    bbox_y1: Mapped[int | None] = mapped_column(Integer)
    bbox_x2: Mapped[int | None] = mapped_column(Integer)
    bbox_y2: Mapped[int | None] = mapped_column(Integer)
    dice_score: Mapped[float | None] = mapped_column(Float)
    heatmap_dn_path: Mapped[str | None] = mapped_column(String(500))
    heatmap_eff_path: Mapped[str | None] = mapped_column(String(500))
    lung_mask_path: Mapped[str | None] = mapped_column(String(500))

    # Relationships
    parent_prediction: Mapped["Prediction"] = relationship(back_populates="analysis")


class PredictionDoctorReview(TimestampMixin, Base):
    """Bảng xét duyệt bác sĩ"""
    __tablename__ = "prediction_doctor_review"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(ForeignKey("predictions.id"), unique=True, nullable=False, index=True)
    doctor_note: Mapped[str | None] = mapped_column(Text)
    doctor_confirmed: Mapped[bool | None] = mapped_column(Boolean, default=False)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime)

    # Relationships
    parent_prediction: Mapped["Prediction"] = relationship(back_populates="doctor_review")


class PredictionProcessingLog(TimestampMixin, Base):
    """Bảng nhật ký xử lý"""
    __tablename__ = "prediction_processing_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(ForeignKey("predictions.id"), unique=True, nullable=False, index=True)
    error_message: Mapped[str | None] = mapped_column(Text)
    processing_time_ms: Mapped[int | None] = mapped_column(Integer)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    # Relationships
    parent_prediction: Mapped["Prediction"] = relationship(back_populates="processing_log")


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
