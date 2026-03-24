from datetime import datetime


class AppError(Exception):
    def __init__(self, *, status_code: int, error_code: str, message: str, headers: dict | None = None) -> None:
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.headers = headers or {}
        super().__init__(message)


class ValidationAppError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(status_code=422, error_code='VALIDATION_ERROR', message=message)


class AuthenticationAppError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(status_code=401, error_code='UNAUTHORIZED', message=message)


class PermissionAppError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(status_code=403, error_code='FORBIDDEN', message=message)


class NotFoundAppError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(status_code=404, error_code='NOT_FOUND', message=message)


class RateLimitAppError(AppError):
    def __init__(self, message: str, retry_after: int) -> None:
        super().__init__(
            status_code=429,
            error_code='RATE_LIMIT_EXCEEDED',
            message=message,
            headers={'Retry-After': str(retry_after)},
        )


class InferenceAppError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(status_code=500, error_code='INFERENCE_FAILED', message=message)


class DatabaseAppError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(status_code=500, error_code='DATABASE_ERROR', message=message)


def error_payload(status_code: int, error_code: str, message: str) -> dict:
    return {
        'status_code': status_code,
        'error_code': error_code,
        'message': message,
        'timestamp': datetime.utcnow().isoformat(),
    }
