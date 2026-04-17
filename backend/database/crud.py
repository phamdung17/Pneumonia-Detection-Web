from __future__ import annotations

from datetime import datetime
from pathlib import Path

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from backend.database import models


def hash_refresh_token(token: str) -> str:
    import hashlib

    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def get_user_by_username(db: Session, username: str) -> models.User | None:
    return db.scalar(select(models.User).where(models.User.username == username))


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.scalar(select(models.User).where(models.User.email == email))


def get_user_by_id(db: Session, user_id: int) -> models.User | None:
    return db.get(models.User, user_id)


def list_users(db: Session, page: int = 1, limit: int = 20, search: str | None = None, role: str | None = None, is_active: bool | None = None) -> tuple[list[models.User], int]:
    stmt: Select[tuple[models.User]] = select(models.User)
    count_stmt = select(func.count()).select_from(models.User)
    if search:
        like = f'%{search}%'
        stmt = stmt.where(
            models.User.username.like(like)
            | models.User.full_name.like(like)
            | models.User.email.like(like)
        )
        count_stmt = count_stmt.where(
            models.User.username.like(like)
            | models.User.full_name.like(like)
            | models.User.email.like(like)
        )
    if role:
        stmt = stmt.where(models.User.role == role)
        count_stmt = count_stmt.where(models.User.role == role)
    if is_active is not None:
        stmt = stmt.where(models.User.is_active == is_active)
        count_stmt = count_stmt.where(models.User.is_active == is_active)
    total = db.scalar(count_stmt) or 0
    items = db.scalars(stmt.order_by(models.User.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    return items, total


def create_user(db: Session, *, username: str, email: str | None, password_hash: str, full_name: str, role: models.UserRole) -> models.User:
    user = models.User(username=username, email=email, password_hash=password_hash, full_name=full_name, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_audit_log(db: Session, *, user_id: int | None, action: str, target_type: str, target_id: str | None = None, ip_address: str | None = None, user_agent: str | None = None, detail: dict | None = None, commit: bool = True) -> models.AuditLog:
    log = models.AuditLog(user_id=user_id, action=action, target_type=target_type, target_id=target_id, ip_address=ip_address, user_agent=user_agent, detail=detail)
    db.add(log)
    if commit:
        db.commit()
        db.refresh(log)
    return log


def create_stored_refresh_token(db: Session, *, user_id: int, token: str, expires_in_days: int) -> models.RefreshToken:
    from datetime import timedelta

    refresh = models.RefreshToken(user_id=user_id, token_hash=hash_refresh_token(token), expires_at=datetime.utcnow() + timedelta(days=expires_in_days))
    db.add(refresh)
    db.commit()
    db.refresh(refresh)
    return refresh


def get_valid_refresh_token(db: Session, token: str) -> models.RefreshToken | None:
    token_hash = hash_refresh_token(token)
    return db.scalar(select(models.RefreshToken).where(models.RefreshToken.token_hash == token_hash, models.RefreshToken.is_revoked.is_(False), models.RefreshToken.expires_at > datetime.utcnow()))


def revoke_refresh_token(db: Session, refresh_token: models.RefreshToken) -> None:
    refresh_token.is_revoked = True
    refresh_token.revoked_at = datetime.utcnow()
    db.add(refresh_token)
    db.commit()


def create_prediction(db: Session, *, user_id: int, task_id: str, filename: str, file_path: str) -> models.Prediction:
    prediction = models.Prediction(user_id=user_id, task_id=task_id, filename=filename, file_path=file_path)
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def get_prediction_by_task_id(db: Session, task_id: str) -> models.Prediction | None:
    return db.scalar(select(models.Prediction).where(models.Prediction.task_id == task_id))


def get_prediction_by_id(db: Session, prediction_id: int) -> models.Prediction | None:
    return db.get(models.Prediction, prediction_id)


def list_predictions_for_user(db: Session, *, user_id: int, page: int, limit: int, prediction: str | None = None, status: str | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> tuple[list[models.Prediction], int]:
    stmt = select(models.Prediction).where(models.Prediction.user_id == user_id)
    count_stmt = select(func.count()).select_from(models.Prediction).where(models.Prediction.user_id == user_id)
    if prediction:
        stmt = stmt.where(models.Prediction.prediction == prediction)
        count_stmt = count_stmt.where(models.Prediction.prediction == prediction)
    if status:
        stmt = stmt.where(models.Prediction.status == status)
        count_stmt = count_stmt.where(models.Prediction.status == status)
    if date_from:
        stmt = stmt.where(models.Prediction.created_at >= date_from)
        count_stmt = count_stmt.where(models.Prediction.created_at >= date_from)
    if date_to:
        stmt = stmt.where(models.Prediction.created_at <= date_to)
        count_stmt = count_stmt.where(models.Prediction.created_at <= date_to)
    total = db.scalar(count_stmt) or 0
    items = db.scalars(stmt.order_by(models.Prediction.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    return items, total


def list_predictions_admin(db: Session, *, page: int, limit: int, user_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> tuple[list[models.Prediction], int]:
    stmt = select(models.Prediction)
    count_stmt = select(func.count()).select_from(models.Prediction)
    if user_id:
        stmt = stmt.where(models.Prediction.user_id == user_id)
        count_stmt = count_stmt.where(models.Prediction.user_id == user_id)
    if date_from:
        stmt = stmt.where(models.Prediction.created_at >= date_from)
        count_stmt = count_stmt.where(models.Prediction.created_at >= date_from)
    if date_to:
        stmt = stmt.where(models.Prediction.created_at <= date_to)
        count_stmt = count_stmt.where(models.Prediction.created_at <= date_to)
    total = db.scalar(count_stmt) or 0
    items = db.scalars(stmt.order_by(models.Prediction.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    return items, total


def list_audit_logs(db: Session, *, page: int, limit: int, action: str | None = None, user_id: int | None = None, date_from: datetime | None = None) -> tuple[list[models.AuditLog], int]:
    stmt = select(models.AuditLog)
    count_stmt = select(func.count()).select_from(models.AuditLog)
    if action:
        stmt = stmt.where(models.AuditLog.action == action)
        count_stmt = count_stmt.where(models.AuditLog.action == action)
    if user_id:
        stmt = stmt.where(models.AuditLog.user_id == user_id)
        count_stmt = count_stmt.where(models.AuditLog.user_id == user_id)
    if date_from:
        stmt = stmt.where(models.AuditLog.created_at >= date_from)
        count_stmt = count_stmt.where(models.AuditLog.created_at >= date_from)
    total = db.scalar(count_stmt) or 0
    items = db.scalars(stmt.order_by(models.AuditLog.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    return items, total


def count_queue_items(db: Session) -> dict:
    return {
        'pending': db.scalar(select(func.count()).select_from(models.Prediction).where(models.Prediction.status == models.ProcessingStatus.queued)) or 0,
        'active': db.scalar(select(func.count()).select_from(models.Prediction).where(models.Prediction.status == models.ProcessingStatus.processing)) or 0,
        'failed': db.scalar(select(func.count()).select_from(models.Prediction).where(models.Prediction.status == models.ProcessingStatus.failed)) or 0,
    }


def cleanup_original_files(db: Session, *, retention_hours: int) -> int:
    from datetime import timedelta

    cutoff = datetime.utcnow() - timedelta(hours=retention_hours)
    items = db.scalars(select(models.Prediction).where(models.Prediction.created_at < cutoff)).all()
    deleted = 0
    for item in items:
        path = Path(item.file_path)
        if path.exists() and path.name.startswith('original.'):
            path.unlink(missing_ok=True)
            deleted += 1
    return deleted
