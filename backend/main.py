from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from backend.api import admin, auth, health, history, predict, stats
from backend.auth.jwt import decode_access_token
from backend.config import get_settings
from backend.database.connection import Base, engine
from backend.database.schema_sync import ensure_user_schema
from backend.models.loader import model_registry
from backend.utils.errors import AppError, error_payload
from backend.utils.file import resolve_asset_path
from backend.utils.logging import error_logger, request_logger
from backend.utils.rate_limit import check_rate_limit


settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_user_schema(engine)
    model_registry.load()
    yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])


@app.middleware('http')
async def request_guard(request: Request, call_next):
    if request.url.path.startswith('/api/') and request.url.path not in {'/api/auth/login', '/api/predict/'}:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            try:
                payload = decode_access_token(auth_header.split(' ', 1)[1])
                user_id = payload.get('sub')
                if user_id:
                    check_rate_limit(f'ratelimit:api:{user_id}', 100, 60)
            except Exception:
                pass
    response = await call_next(request)
    request_logger.info('method=%s path=%s status=%s ip=%s', request.method, request.url.path, response.status_code, request.client.host if request.client else None)
    return response


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=error_payload(exc.status_code, exc.error_code, exc.message), headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content=error_payload(422, 'VALIDATION_ERROR', 'Request validation failed'))


@app.exception_handler(Exception)
async def generic_handler(_: Request, exc: Exception) -> JSONResponse:
    error_logger.exception('unhandled_exception')
    return JSONResponse(status_code=500, content=error_payload(500, 'INTERNAL_ERROR', 'Internal server error'))


@app.get('/static/{task_id}/{filename}')
def public_static(task_id: str, filename: str) -> FileResponse:
    asset_path = resolve_asset_path(task_id, filename)
    return FileResponse(path=asset_path)


@app.websocket('/ws/{task_id}')
async def prediction_ws_alias(websocket: WebSocket, task_id: str) -> None:
    await predict.prediction_ws(websocket, task_id)


app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(history.router)
app.include_router(stats.router)
app.include_router(admin.router)
app.include_router(health.router)
