from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_client_ip, get_current_user
from backend.auth.jwt import create_access_token, create_refresh_token
from backend.auth.password import hash_password, verify_password
from backend.config import get_settings
from backend.database.connection import get_db
from backend.database.crud import create_audit_log, create_stored_refresh_token, create_user, get_user_by_email, get_user_by_identifier, get_user_by_username, get_valid_refresh_token, revoke_refresh_token
from backend.database.models import ApprovalStatus, User, UserRole
from backend.schemas import ChangePasswordRequest, LoginRequest, MessageResponse, RefreshRequest, RegisterResponse, TokenResponse, UserRead, UserRegister
from backend.utils.errors import AuthenticationAppError, PermissionAppError, ValidationAppError
from backend.utils.rate_limit import check_rate_limit


router = APIRouter(prefix='/api/auth', tags=['auth'])
settings = get_settings()


@router.post('/register', response_model=RegisterResponse)
def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)) -> RegisterResponse:
    check_rate_limit(f'ratelimit:register:{get_client_ip(request)}', 5, 60)
    if payload.role not in {UserRole.doctor, UserRole.technician}:
        raise ValidationAppError('Only doctor or technician accounts can be registered here')
    if get_user_by_username(db, payload.username):
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
        approval_status=ApprovalStatus.pending,
        is_active=False,
    )
    create_audit_log(
        db,
        user_id=user.id,
        action='register',
        target_type='user',
        target_id=str(user.id),
        ip_address=get_client_ip(request),
        user_agent=request.headers.get('user-agent'),
        detail={'approval_status': user.approval_status.value},
    )
    return RegisterResponse(message='Dang ky thanh cong. Tai khoan dang cho quan tri vien phe duyet.', user=UserRead.model_validate(user))


@router.post('/login', response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    check_rate_limit(f'ratelimit:login:{get_client_ip(request)}', 10, 60)
    user = get_user_by_identifier(db, payload.identifier)
    if not user:
        raise AuthenticationAppError('Invalid credentials')
    if user.approval_status == ApprovalStatus.pending:
        raise PermissionAppError('Tai khoan dang cho quan tri vien phe duyet')
    if user.approval_status == ApprovalStatus.rejected:
        raise PermissionAppError('Tai khoan da bi tu choi')
    if not user.is_active:
        raise PermissionAppError('Tai khoan tam thoi bi vo hieu hoa')
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise PermissionAppError(f'Account locked until {user.locked_until.isoformat()}')
    if not verify_password(payload.password, user.password_hash):
        user.failed_login_count += 1
        if user.failed_login_count >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=30)
        db.add(user)
        db.commit()
        raise AuthenticationAppError('Invalid credentials')

    user.failed_login_count = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    db.add(user)
    db.commit()

    access_token = create_access_token(user.id, user.role.value)
    refresh_token = create_refresh_token()
    create_stored_refresh_token(db, user_id=user.id, token=refresh_token, expires_in_days=settings.jwt_refresh_expire_days)
    create_audit_log(db, user_id=user.id, action='login', target_type='user', target_id=str(user.id), ip_address=get_client_ip(request), user_agent=request.headers.get('user-agent'))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserRead.model_validate(user))


@router.post('/logout', response_model=MessageResponse)
def logout(payload: RefreshRequest, db: Session = Depends(get_db)) -> MessageResponse:
    refresh = get_valid_refresh_token(db, payload.refresh_token)
    if refresh:
        revoke_refresh_token(db, refresh)
    return MessageResponse(message='Logged out successfully')


@router.post('/refresh', response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    refresh = get_valid_refresh_token(db, payload.refresh_token)
    if not refresh:
        raise AuthenticationAppError('Refresh token is invalid')
    revoke_refresh_token(db, refresh)
    user = refresh.user
    if user.approval_status != ApprovalStatus.approved or not user.is_active:
        raise AuthenticationAppError('User is invalid or inactive')
    new_access = create_access_token(user.id, user.role.value)
    new_refresh = create_refresh_token()
    create_stored_refresh_token(db, user_id=user.id, token=new_refresh, expires_in_days=settings.jwt_refresh_expire_days)
    return TokenResponse(access_token=new_access, refresh_token=new_refresh, user=UserRead.model_validate(user))


@router.get('/me', response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.put('/me/password', response_model=MessageResponse)
def change_password(payload: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    if not verify_password(payload.old_password, current_user.password_hash):
        raise AuthenticationAppError('Old password is incorrect')
    current_user.password_hash = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()
    return MessageResponse(message='Password changed successfully')
