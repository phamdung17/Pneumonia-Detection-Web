from datetime import UTC, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.api.predict import serialize_prediction
from backend.auth.dependencies import get_current_user, require_roles
from backend.auth.password import hash_password
from backend.database.connection import get_db
from backend.database.crud import create_audit_log, create_user, get_user_by_email, list_audit_logs, list_predictions_admin, list_users
from backend.database.models import Prediction, ProcessingStatus, User, UserRole
from backend.schemas import AdminDashboardSummary, MessageResponse, PaginatedAuditLogs, PaginatedPredictions, PaginatedUsers, UserCreate, UserRead, UserUpdate
from backend.utils.errors import NotFoundAppError, ValidationAppError


router = APIRouter(prefix='/api/admin', tags=['admin'])
BANGKOK_TZ = ZoneInfo('Asia/Bangkok')


@router.get('/dashboard', response_model=AdminDashboardSummary)
def admin_dashboard(_: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> AdminDashboardSummary:
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    active_users = db.scalar(select(func.count()).select_from(User).where(User.is_active.is_(True))) or 0
    inactive_users = total_users - active_users
    total_predictions = db.scalar(select(func.count()).select_from(Prediction)) or 0
    done_predictions = db.scalar(select(func.count()).select_from(Prediction).where(Prediction.status == ProcessingStatus.done)) or 0
    failed_predictions = db.scalar(select(func.count()).select_from(Prediction).where(Prediction.status == ProcessingStatus.failed)) or 0
    return AdminDashboardSummary(
        total_users=total_users,
        active_users=active_users,
        inactive_users=inactive_users,
        total_predictions=total_predictions,
        done_predictions=done_predictions,
        failed_predictions=failed_predictions,
    )


@router.get('/users', response_model=PaginatedUsers)
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = None,
    role: str | None = None,
    is_active: bool | None = None,
    _: User = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db),
) -> PaginatedUsers:
    items, total = list_users(db, page=page, limit=limit, search=search, role=role, is_active=is_active)
    return PaginatedUsers(items=[UserRead.model_validate(item) for item in items], total=total)


@router.get('/users/{user_id}', response_model=UserRead)
def get_user_detail(user_id: int, _: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> UserRead:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundAppError('User not found')
    return UserRead.model_validate(user)


@router.post('/users', response_model=UserRead)
def add_user(payload: UserCreate, current_user: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> UserRead:
    if db.scalar(select(User).where(User.username == payload.username)):
        raise ValidationAppError('Username already exists')
    if get_user_by_email(db, str(payload.email)):
        raise ValidationAppError('Email already exists')
    user = create_user(
        db,
        username=payload.username,
        email=str(payload.email),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    create_audit_log(db, user_id=current_user.id, action='admin_create_user', target_type='user', target_id=str(user.id), detail={'role': payload.role.value})
    return UserRead.model_validate(user)


@router.put('/users/{user_id}', response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, current_user: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> UserRead:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundAppError('User not found')
    if user.id == current_user.id and payload.is_active is False:
        raise ValidationAppError('You cannot deactivate your own account')
    changed_fields: list[str] = []
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)
        changed_fields.append(field)
    db.add(user)
    db.commit()
    db.refresh(user)
    if changed_fields:
        create_audit_log(db, user_id=current_user.id, action='admin_update_user', target_type='user', target_id=str(user.id), detail={'fields': changed_fields})
    return UserRead.model_validate(user)


@router.put('/users/{user_id}/unlock', response_model=MessageResponse)
def unlock_user(user_id: int, current_user: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> MessageResponse:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundAppError('User not found')
    user.failed_login_count = 0
    user.locked_until = None
    db.add(user)
    db.commit()
    create_audit_log(db, user_id=current_user.id, action='admin_unlock_user', target_type='user', target_id=str(user.id))
    return MessageResponse(message='User unlocked')


@router.put('/users/{user_id}/lock', response_model=MessageResponse)
def lock_user(user_id: int, current_user: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> MessageResponse:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundAppError('User not found')
    if user.id == current_user.id:
        raise ValidationAppError('You cannot lock your own account')
    user.is_active = False
    db.add(user)
    db.commit()
    create_audit_log(db, user_id=current_user.id, action='admin_lock_user', target_type='user', target_id=str(user.id))
    return MessageResponse(message='User locked successfully')


@router.delete('/users/{user_id}', response_model=MessageResponse)
def deactivate_user_alias(user_id: int, current_user: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> MessageResponse:
    user = db.get(User, user_id)
    if not user:
        raise NotFoundAppError('User not found')
    if user.id == current_user.id:
        raise ValidationAppError('You cannot lock your own account')
    user.is_active = False
    db.add(user)
    db.commit()
    create_audit_log(db, user_id=current_user.id, action='admin_lock_user', target_type='user', target_id=str(user.id), detail={'via': 'delete_alias'})
    return MessageResponse(message='User locked successfully')


@router.get('/history', response_model=PaginatedPredictions)
def admin_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    _: User = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db),
) -> PaginatedPredictions:
    items, total = list_predictions_admin(db, page=page, limit=limit, user_id=user_id, date_from=date_from, date_to=date_to)
    return PaginatedPredictions(items=[serialize_prediction(item) for item in items], total=total, page=page)


@router.get('/audit', response_model=PaginatedAuditLogs)
def admin_audit(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = None,
    action: str | None = None,
    user_id: int | None = None,
    date_from: datetime | None = None,
    _: User = Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db),
) -> PaginatedAuditLogs:
    items, total = list_audit_logs(db, page=page, limit=limit, search=search, action=action, user_id=user_id, date_from=date_from)
    target_user_ids = {
        int(item.target_id)
        for item in items
        if item.target_type == 'user' and item.target_id and item.target_id.isdigit()
    }
    target_users = (
        db.scalars(select(User).where(User.id.in_(target_user_ids))).all()
        if target_user_ids
        else []
    )
    target_map = {user.id: user for user in target_users}
    serialized = [
        {
            'id': item.id,
            'user_id': item.user_id,
            'action': item.action,
            'target_type': item.target_type,
            'target_id': item.target_id,
            'target_display': _build_target_display(item.target_type, item.target_id, target_map),
            'ip_address': item.ip_address,
            'user_agent': item.user_agent,
            'detail': item.detail,
            'created_at': item.created_at,
            'created_at_local': _format_bangkok_time(item.created_at),
        }
        for item in items
    ]
    return PaginatedAuditLogs(items=serialized, total=total, page=page)


def _build_target_display(target_type: str, target_id: str | None, target_map: dict[int, User]) -> str:
    if target_type == 'user' and target_id and target_id.isdigit():
        target_user = target_map.get(int(target_id))
        if target_user:
            return f'{target_user.full_name} ({target_user.username})'
    return 'System'


def _format_bangkok_time(value: datetime) -> str:
    utc_value = value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
    local_value = utc_value.astimezone(BANGKOK_TZ)
    return local_value.strftime('%d/%m/%Y %H:%M:%S')
