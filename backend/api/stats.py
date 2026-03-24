from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.auth.dependencies import require_roles
from backend.database.connection import get_db
from backend.database.models import Prediction, User, UserRole


router = APIRouter(prefix='/api/stats', tags=['stats'])


@router.get('/me')
def my_stats(current_user: User = Depends(require_roles(UserRole.doctor, UserRole.admin)), db: Session = Depends(get_db)) -> dict:
    total = db.scalar(select(func.count()).select_from(Prediction).where(Prediction.user_id == current_user.id)) or 0
    completed = db.scalar(select(func.count()).select_from(Prediction).where(Prediction.user_id == current_user.id, Prediction.status == 'done')) or 0
    pneumonia = db.scalar(select(func.count()).select_from(Prediction).where(Prediction.user_id == current_user.id, Prediction.prediction == 'PNEUMONIA')) or 0
    return {'user_id': current_user.id, 'total_cases': total, 'completed_cases': completed, 'pneumonia_cases': pneumonia}


@router.get('/all')
def all_stats(current_user: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> dict:
    return {
        'total_users': db.scalar(select(func.count()).select_from(User)) or 0,
        'total_predictions': db.scalar(select(func.count()).select_from(Prediction)) or 0,
        'done_predictions': db.scalar(select(func.count()).select_from(Prediction).where(Prediction.status == 'done')) or 0,
        'failed_predictions': db.scalar(select(func.count()).select_from(Prediction).where(Prediction.status == 'failed')) or 0,
    }


@router.get('/weekly')
def weekly_stats(current_user: User = Depends(require_roles(UserRole.doctor, UserRole.admin)), db: Session = Depends(get_db)) -> dict:
    since = datetime.utcnow() - timedelta(days=7)
    stmt = select(func.date(Prediction.created_at), func.count()).where(Prediction.created_at >= since).group_by(func.date(Prediction.created_at)).order_by(func.date(Prediction.created_at))
    if current_user.role != UserRole.admin:
        stmt = stmt.where(Prediction.user_id == current_user.id)
    rows = db.execute(stmt).all()
    return {'items': [{'date': str(day), 'count': count} for day, count in rows]}
