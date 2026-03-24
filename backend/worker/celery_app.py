try:
    from celery import Celery
except Exception:
    Celery = None

from backend.config import get_settings


settings = get_settings()
celery_app = Celery("pneumonia_backend", broker=settings.redis_url, backend=settings.redis_url) if Celery else None
