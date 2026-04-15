from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.auth.jwt import decode_access_token
from backend.database.connection import get_db
from backend.database.crud import get_user_by_id
from backend.database.models import ApprovalStatus, User, UserRole
from backend.utils.errors import AuthenticationAppError, PermissionAppError


security = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security), db: Session = Depends(get_db)) -> User:
    if credentials is None:
        raise AuthenticationAppError('Missing access token')
    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError as exc:
        raise AuthenticationAppError('Invalid access token') from exc
    user_id = int(payload['sub'])
    user = get_user_by_id(db, user_id)
    if not user:
        raise AuthenticationAppError('User is invalid or inactive')
    if user.approval_status != ApprovalStatus.approved:
        raise AuthenticationAppError('User is invalid or inactive')
    if not user.is_active:
        raise AuthenticationAppError('User is invalid or inactive')
    return user


def require_roles(*roles: UserRole):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise PermissionAppError('Insufficient permissions')
        return current_user

    return dependency


def get_client_ip(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return 'unknown'
