from __future__ import annotations

from time import perf_counter, time

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.loader import model_registry


router = APIRouter(prefix='/health', tags=['health'])
_started_at = time()


@router.get('/')
def health_root(db: Session = Depends(get_db)) -> dict:
    db_connected = True
    try:
        db.execute(text('SELECT 1'))
    except Exception:
        db_connected = False
    model_health = model_registry.health()
    status = 'ok' if db_connected and bool(model_health.get('loaded')) else 'degraded'
    return {
        'status': status,
        'db': db_connected,
        'model': bool(model_health.get('loaded')),
        'uptime': int(time() - _started_at),
    }


@router.get('/model')
def health_model() -> dict:
    return {
        'loaded': bool(model_registry.health().get('loaded')),
        'inference_test_ms': model_registry.inference_test_ms(),
    }


@router.get('/db')
def health_db(db: Session = Depends(get_db)) -> dict:
    start = perf_counter()
    db.execute(text('SELECT 1'))
    latency_ms = int((perf_counter() - start) * 1000)
    return {'connected': True, 'latency_ms': latency_ms}
