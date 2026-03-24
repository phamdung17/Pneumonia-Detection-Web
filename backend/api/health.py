from time import perf_counter

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.database.crud import count_queue_items
from backend.models.loader import model_registry
from backend.utils.rate_limit import redis_client


router = APIRouter(prefix='/health', tags=['health'])


@router.get('/')
def health_root(db: Session = Depends(get_db)) -> dict:
    db_status = 'ok'
    try:
        db.execute(text('SELECT 1'))
    except Exception:
        db_status = 'error'
    redis_status = 'unknown'
    if redis_client is not None:
        try:
            redis_client.ping()
            redis_status = 'ok'
        except Exception:
            redis_status = 'error'
    queue = count_queue_items(db)
    overall = 'ok' if db_status == 'ok' and redis_status != 'error' else 'degraded'
    return {'status': overall, 'db': db_status, 'redis': redis_status, 'models': model_registry.health(), 'queue_size': queue['pending'] + queue['active']}


@router.get('/models')
def health_models() -> dict:
    return model_registry.health()


@router.get('/queue')
def health_queue(db: Session = Depends(get_db)) -> dict:
    return count_queue_items(db)


@router.get('/db')
def health_db(db: Session = Depends(get_db)) -> dict:
    start = perf_counter()
    db.execute(text('SELECT 1'))
    latency_ms = int((perf_counter() - start) * 1000)
    return {'connected': True, 'latency_ms': latency_ms}
