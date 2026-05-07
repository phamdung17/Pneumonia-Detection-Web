from __future__ import annotations

import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..auth.dependencies import get_client_ip, get_current_user
from ..auth.jwt import create_access_token, create_refresh_token
from ..auth.password import hash_password, verify_password
from ..config import get_settings
from ..database.connection import get_db
from ..database.crud import (
    create_audit_log,
    create_password_reset_token,
    create_stored_refresh_token,
    create_user,
    get_user_by_email,
    get_user_by_username,
    get_valid_password_reset_token,
    get_valid_refresh_token,
    mark_password_reset_token_used,
    revoke_refresh_token,
    revoke_refresh_tokens_for_user,
)
from ..database.helpers import update_user_security_log, get_user_security_log
from ..database.models import User, UserRole
from ..schemas import ChangePasswordRequest, ForgotPasswordRequest, ForgotPasswordResponse, LoginRequest, MessageResponse, ProfileUpdateRequest, RefreshRequest, ResetPasswordRequest, TokenResponse, UserRead, UserRegister
from ..utils.errors import AuthenticationAppError, PermissionAppError, ValidationAppError
from ..utils.rate_limit import check_rate_limit


router = APIRouter(prefix='/api/auth', tags=['auth'])
settings = get_settings()
RESET_TOKEN_EXPIRE_MINUTES = 15


@router.post('/register', response_model=TokenResponse)
def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    check_rate_limit(f'ratelimit:register:{get_client_ip(request)}', 5, 60)
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
        role=UserRole.client,
    )
    access_token = create_access_token(user.id, user.role.value)
    refresh_token = create_refresh_token()
    create_stored_refresh_token(db, user_id=user.id, token=refresh_token, expires_in_days=settings.jwt_refresh_expire_days)
    create_audit_log(db, user_id=user.id, action='register', target_type='user', target_id=str(user.id), ip_address=get_client_ip(request), user_agent=request.headers.get('user-agent'))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserRead.model_validate(user))


@router.post('/login', response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    check_rate_limit(f'ratelimit:login:{get_client_ip(request)}', 10, 60)
    user = get_user_by_username(db, payload.username)
    if not user:
        raise AuthenticationAppError('Invalid credentials')
    if not user.is_active:
        raise PermissionAppError('User is inactive')
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


@router.post('/forgot-password', response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)) -> ForgotPasswordResponse:
    check_rate_limit(f'ratelimit:forgot-password:{get_client_ip(request)}', 5, 60)
    user = get_user_by_email(db, payload.email)
    if not user:
        raise ValidationAppError('Email chưa được đăng ký')
    if not user.is_active:
        raise PermissionAppError('Tài khoản tạm thời bị vô hiệu hóa')

    reset_token = secrets.token_urlsafe(32)
    create_password_reset_token(db, user_id=user.id, token=reset_token, expires_in_minutes=RESET_TOKEN_EXPIRE_MINUTES)
    create_audit_log(
        db,
        user_id=user.id,
        action='password_reset_requested',
        target_type='user',
        target_id=str(user.id),
        ip_address=get_client_ip(request),
        user_agent=request.headers.get('user-agent'),
    )
    return ForgotPasswordResponse(
        message='Email hợp lệ, bạn có thể đặt lại mật khẩu.',
        reset_token=reset_token,
        reset_url=f'/reset-password?token={reset_token}',
        expires_in_minutes=RESET_TOKEN_EXPIRE_MINUTES,
    )


@router.post('/reset-password', response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)) -> MessageResponse:
    check_rate_limit(f'ratelimit:reset-password:{get_client_ip(request)}', 10, 60)
    reset_token = get_valid_password_reset_token(db, payload.token)
    if not reset_token:
        raise ValidationAppError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn')

    user = reset_token.user
    user.password_hash = hash_password(payload.new_password)
    user.failed_login_count = 0
    user.locked_until = None
    db.add(user)
    db.commit()
    mark_password_reset_token_used(db, reset_token)
    revoke_refresh_tokens_for_user(db, user.id)
    create_audit_log(
        db,
        user_id=user.id,
        action='password_reset_completed',
        target_type='user',
        target_id=str(user.id),
        ip_address=get_client_ip(request),
        user_agent=request.headers.get('user-agent'),
    )
    return MessageResponse(message='Đổi mật khẩu thành công')


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
    new_access = create_access_token(user.id, user.role.value)
    new_refresh = create_refresh_token()
    create_stored_refresh_token(db, user_id=user.id, token=new_refresh, expires_in_days=settings.jwt_refresh_expire_days)
    return TokenResponse(access_token=new_access, refresh_token=new_refresh, user=UserRead.model_validate(user))


@router.get('/me', response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.put('/me', response_model=UserRead)
def update_profile(payload: ProfileUpdateRequest, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserRead:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise AuthenticationAppError('Current password is incorrect')
    existing = get_user_by_email(db, str(payload.email))
    if existing and existing.id != current_user.id:
        raise ValidationAppError('Email already exists')
    current_user.full_name = payload.full_name
    current_user.email = str(payload.email)
    current_user.phone = payload.phone
    current_user.avatar_url = payload.avatar_url
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    create_audit_log(
        db,
        user_id=current_user.id,
        action='profile_update',
        target_type='user',
        target_id=str(current_user.id),
        ip_address=get_client_ip(request),
        user_agent=request.headers.get('user-agent'),
        detail={'updated_fields': ['full_name', 'email', 'phone', 'avatar_url']},
    )
    return UserRead.model_validate(current_user)


@router.put('/me/password', response_model=MessageResponse)
def change_password(payload: ChangePasswordRequest, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    if not verify_password(payload.old_password, current_user.password_hash):
        raise AuthenticationAppError('Old password is incorrect')
    current_user.password_hash = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()
    create_audit_log(
        db,
        user_id=current_user.id,
        action='password_change',
        target_type='user',
        target_id=str(current_user.id),
        ip_address=get_client_ip(request),
        user_agent=request.headers.get('user-agent'),
    )
    return MessageResponse(message='Password changed successfully')
