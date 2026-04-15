from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api.predict import serialize_prediction
from backend.auth.dependencies import require_roles
from backend.auth.password import hash_password
from backend.database.connection import get_db
from backend.database.crud import create_audit_log, create_user, get_user_by_email, list_audit_logs, list_predictions_admin, list_users
from backend.database.models import ApprovalStatus, User, UserRole
from backend.schemas import ApprovalDecisionRequest, MessageResponse, PaginatedAuditLogs, PaginatedPredictions, PaginatedUsers, UserCreate, UserRead, UserUpdate
from backend.utils.errors import NotFoundAppError, ValidationAppError


router = APIRouter(prefix='/api/admin', tags=['admin'])


@router.get('/users', response_model=PaginatedUsers)
def get_users(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), search: str | None = None, role: str | None = None, is_active: bool | None = None, approval_status: str | None = None, _: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> PaginatedUsers:
    items, total = list_users(db, page=page, limit=limit, search=search, role=role, is_active=is_active, approval_status=approval_status)
    return PaginatedUsers(items=[UserRead.model_validate(item) for item in items], total=total)


@router.get('/users/{user_id}', response_model=UserRead)
def get_user_detail(user_id: int, _: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> UserRead:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundAppError('User not found')
    return UserRead.model_validate(user)


@router.post('/users', response_model=UserRead)
def add_user(payload: UserCreate, current_admin: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> UserRead:
    if db.scalar(select(User).where(User.username == payload.username)):
        raise ValidationAppError('Username already exists')
    if get_user_by_email(db, payload.email):
        raise ValidationAppError('Email already exists')
    user = create_user(
        db,
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        department=payload.department,
        approval_status=ApprovalStatus.approved,
        is_active=True,
    )
    create_audit_log(db, user_id=current_admin.id, action='admin_create_user', target_type='user', target_id=str(user.id))
    return UserRead.model_validate(user)


@router.put('/users/{user_id}', response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, current_admin: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> UserRead:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundAppError('User not found')
    if payload.email and payload.email != user.email and get_user_by_email(db, payload.email):
        raise ValidationAppError('Email already exists')
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    create_audit_log(db, user_id=current_admin.id, action='admin_update_user', target_type='user', target_id=str(user.id))
    return UserRead.model_validate(user)


@router.get('/approvals', response_model=PaginatedUsers)
def pending_approvals(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), search: str | None = None, role: str | None = None, _: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> PaginatedUsers:
    items, total = list_users(db, page=page, limit=limit, search=search, role=role, approval_status=ApprovalStatus.pending.value)
    return PaginatedUsers(items=[UserRead.model_validate(item) for item in items], total=total)


@router.post('/approvals/{user_id}/approve', response_model=UserRead)
def approve_user(user_id: int, payload: ApprovalDecisionRequest, current_admin: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> UserRead:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundAppError('User not found')
    user.approval_status = ApprovalStatus.approved
    user.is_active = True
    db.add(user)
    db.commit()
    db.refresh(user)
    create_audit_log(db, user_id=current_admin.id, action='approve_user', target_type='user', target_id=str(user.id), detail={'reason': payload.reason})
    return UserRead.model_validate(user)


@router.post('/approvals/{user_id}/reject', response_model=UserRead)
def reject_user(user_id: int, payload: ApprovalDecisionRequest, current_admin: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> UserRead:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundAppError('User not found')
    user.approval_status = ApprovalStatus.rejected
    user.is_active = False
    db.add(user)
    db.commit()
    db.refresh(user)
    create_audit_log(db, user_id=current_admin.id, action='reject_user', target_type='user', target_id=str(user.id), detail={'reason': payload.reason})
    return UserRead.model_validate(user)


@router.put('/users/{user_id}/unlock', response_model=MessageResponse)
def unlock_user(user_id: int, _: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> MessageResponse:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundAppError('User not found')
    user.failed_login_count = 0
    user.locked_until = None
    db.add(user)
    db.commit()
    return MessageResponse(message='User unlocked')


@router.delete('/users/{user_id}', response_model=MessageResponse)
def delete_user(user_id: int, current_admin: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> MessageResponse:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundAppError('User not found')
    db.delete(user)
    db.commit()
    create_audit_log(db, user_id=current_admin.id, action='delete_user', target_type='user', target_id=str(user_id))
    return MessageResponse(message='User deleted')


@router.get('/history', response_model=PaginatedPredictions)
def admin_history(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), user_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None, _: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> PaginatedPredictions:
    items, total = list_predictions_admin(db, page=page, limit=limit, user_id=user_id, date_from=date_from, date_to=date_to)
    return PaginatedPredictions(items=[serialize_prediction(item) for item in items], total=total, page=page)


@router.get('/audit', response_model=PaginatedAuditLogs)
def admin_audit(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), action: str | None = None, user_id: int | None = None, date_from: datetime | None = None, _: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> PaginatedAuditLogs:
    items, total = list_audit_logs(db, page=page, limit=limit, action=action, user_id=user_id, date_from=date_from)
    serialized = [
        {
            'id': item.id,
            'user_id': item.user_id,
            'action': item.action,
            'target_type': item.target_type,
            'target_id': item.target_id,
            'ip_address': item.ip_address,
            'user_agent': item.user_agent,
            'detail': item.detail,
            'created_at': item.created_at,
        }
        for item in items
    ]
    return PaginatedAuditLogs(items=serialized, total=total, page=page)
