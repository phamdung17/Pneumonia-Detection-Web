from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from ..auth.dependencies import require_roles
from ..database.connection import get_db
from ..database.models import Prediction, PredictionLabel, ProcessingStatus, User, UserRole


router = APIRouter(prefix='/api/stats', tags=['stats'])


def _safe_percent(part: int, whole: int) -> float:
    if whole <= 0:
        return 0.0
    return round((part / whole) * 100, 1)


def _average(numbers: list[float]) -> float:
    if not numbers:
        return 0.0
    return round(sum(numbers) / len(numbers), 1)


def _build_mock_dashboard(current_user: User) -> dict:
    now = datetime.utcnow()
    weekly_template = [
        {'offset': 6, 'total': 2, 'done': 2, 'pneumonia': 1, 'normal': 1},
        {'offset': 5, 'total': 1, 'done': 1, 'pneumonia': 0, 'normal': 1},
        {'offset': 4, 'total': 3, 'done': 3, 'pneumonia': 1, 'normal': 2},
        {'offset': 3, 'total': 0, 'done': 0, 'pneumonia': 0, 'normal': 0},
        {'offset': 2, 'total': 2, 'done': 2, 'pneumonia': 1, 'normal': 1},
        {'offset': 1, 'total': 1, 'done': 1, 'pneumonia': 0, 'normal': 1},
        {'offset': 0, 'total': 2, 'done': 1, 'pneumonia': 1, 'normal': 0},
    ]
    weekly_trend: list[dict] = []
    for item in weekly_template:
        day = (now - timedelta(days=item['offset'])).date()
        weekly_trend.append(
            {
                'date': str(day),
                'label': day.strftime('%d/%m'),
                'total': item['total'],
                'done': item['done'],
                'pneumonia': item['pneumonia'],
                'normal': item['normal'],
            }
        )
    recent_activity = [
        {
            'id': 1,
            'created_at': (now - timedelta(days=2)).isoformat(),
            'status': 'done',
            'prediction': 'PNEUMONIA',
            'confidence': 0.98,
            'patient_name': 'Bệnh nhân A',
            'processing_time_ms': 12000,
        },
        {
            'id': 2,
            'created_at': (now - timedelta(days=1)).isoformat(),
            'status': 'done',
            'prediction': 'NORMAL',
            'confidence': 0.95,
            'patient_name': 'Bệnh nhân B',
            'processing_time_ms': 10500,
        },
        {
            'id': 3,
            'created_at': now.isoformat(),
            'status': 'processing',
            'prediction': None,
            'confidence': None,
            'patient_name': 'Bệnh nhân C',
            'processing_time_ms': None,
        },
    ]
    return {
        'user_id': current_user.id,
        'is_mock': True,
        'summary': {
            'total_cases': 6,
            'completed_cases': 5,
            'pending_cases': 1,
            'failed_cases': 0,
            'pneumonia_cases': 2,
            'normal_cases': 3,
            'average_confidence': 96.5,
            'average_processing_time_ms': 11250.0,
            'confirmed_count': 3,
            'rejected_count': 1,
            'pending_review_count': 1,
        },
        'weekly_trend': weekly_trend,
        'recent_activity': recent_activity,
    }


@router.get('/me')
def my_stats(current_user: User = Depends(require_roles(UserRole.client, UserRole.admin)), db: Session = Depends(get_db)) -> dict:
    total = db.scalar(select(func.count()).select_from(Prediction).where(Prediction.user_id == current_user.id)) or 0
    completed = db.scalar(select(func.count()).select_from(Prediction).where(Prediction.user_id == current_user.id, Prediction.status == ProcessingStatus.done)) or 0
    
    # Count pneumonia cases - need to check results table
    pneumonia_count = 0
    predictions = db.scalars(
        select(Prediction)
        .where(Prediction.user_id == current_user.id)
        .options(joinedload(Prediction.results))
    ).all()
    pneumonia_count = sum(1 for p in predictions if p.results and p.results.prediction == PredictionLabel.pneumonia)
    
    return {'user_id': current_user.id, 'total_cases': total, 'completed_cases': completed, 'pneumonia_cases': pneumonia_count}


@router.get('/all')
def all_stats(current_user: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> dict:
    return {
        'total_users': db.scalar(select(func.count()).select_from(User)) or 0,
        'total_predictions': db.scalar(select(func.count()).select_from(Prediction)) or 0,
        'done_predictions': db.scalar(select(func.count()).select_from(Prediction).where(Prediction.status == ProcessingStatus.done)) or 0,
        'failed_predictions': db.scalar(select(func.count()).select_from(Prediction).where(Prediction.status == ProcessingStatus.failed)) or 0,
    }


@router.get('/weekly')
def weekly_stats(current_user: User = Depends(require_roles(UserRole.client, UserRole.admin)), db: Session = Depends(get_db)) -> dict:
    since = datetime.utcnow() - timedelta(days=7)
    stmt = select(func.date(Prediction.created_at), func.count()).where(Prediction.created_at >= since).group_by(func.date(Prediction.created_at)).order_by(func.date(Prediction.created_at))
    if current_user.role != UserRole.admin:
        stmt = stmt.where(Prediction.user_id == current_user.id)
    rows = db.execute(stmt).all()
    return {'items': [{'date': str(day), 'count': count} for day, count in rows]}


@router.get('/dashboard/me')
def my_dashboard_stats(current_user: User = Depends(require_roles(UserRole.client, UserRole.admin)), db: Session = Depends(get_db)) -> dict:
    predictions = db.scalars(
        select(Prediction)
        .where(Prediction.user_id == current_user.id)
        .options(
            joinedload(Prediction.results),
            joinedload(Prediction.patient_info),
            joinedload(Prediction.analysis),
            joinedload(Prediction.doctor_review),
            joinedload(Prediction.processing_log),
        )
        .order_by(Prediction.created_at.desc())
    ).all()

    if not predictions:
        return _build_mock_dashboard(current_user)

    total_cases = len(predictions)
    completed_cases = sum(1 for item in predictions if item.status == ProcessingStatus.done)
    pending_cases = sum(1 for item in predictions if item.status in {ProcessingStatus.queued, ProcessingStatus.processing})
    failed_cases = sum(1 for item in predictions if item.status == ProcessingStatus.failed)

    done_items = [item for item in predictions if item.status == ProcessingStatus.done]
    pneumonia_cases = sum(1 for item in done_items if item.results and item.results.prediction == PredictionLabel.pneumonia)
    normal_cases = sum(1 for item in done_items if item.results and item.results.prediction == PredictionLabel.normal)

    confidence_values = [float(item.results.confidence * 100) for item in done_items if item.results and item.results.confidence is not None]
    processing_seconds = [float(item.processing_log.processing_time_ms / 1000) for item in done_items if item.processing_log and item.processing_log.processing_time_ms is not None]

    since = (datetime.utcnow() - timedelta(days=6)).date()
    timeline: dict[str, dict[str, int]] = {}
    for index in range(7):
        day = since + timedelta(days=index)
        timeline[str(day)] = {'total': 0, 'done': 0, 'pneumonia': 0, 'normal': 0}

    for item in predictions:
        key = str(item.created_at.date())
        if key not in timeline:
            continue
        timeline[key]['total'] += 1
        if item.status == ProcessingStatus.done:
            timeline[key]['done'] += 1
            if item.results and item.results.prediction:
                if item.results.prediction == PredictionLabel.pneumonia:
                    timeline[key]['pneumonia'] += 1
                elif item.results.prediction == PredictionLabel.normal:
                    timeline[key]['normal'] += 1

    confirmed_count = sum(1 for item in predictions if item.doctor_review and item.doctor_review.doctor_confirmed is True)
    rejected_count = sum(1 for item in predictions if item.doctor_review and item.doctor_review.doctor_confirmed is False)
    pending_review_count = sum(1 for item in predictions if not item.doctor_review or item.doctor_review.doctor_confirmed is None)

    weekly_trend = [
        {
            'date': key,
            'label': datetime.fromisoformat(key).strftime('%d/%m'),
            'total': value['total'],
            'done': value['done'],
            'pneumonia': value['pneumonia'],
            'normal': value['normal'],
        }
        for key, value in timeline.items()
    ]

    recent_activity = [
        {
            'id': item.id,
            'created_at': item.created_at.isoformat(),
            'status': item.status.value,
            'prediction': item.results.prediction.value if item.results and item.results.prediction else None,
            'confidence': item.results.confidence if item.results else None,
            'patient_name': item.patient_info.patient_name if item.patient_info else None,
            'processing_time_ms': item.processing_log.processing_time_ms if item.processing_log else None,
        }
        for item in predictions[:8]
    ]

    return {
        'user_id': current_user.id,
        'is_mock': False,
        'summary': {
            'total_cases': total_cases,
            'completed_cases': completed_cases,
            'pending_cases': pending_cases,
            'failed_cases': failed_cases,
            'pneumonia_cases': pneumonia_cases,
            'normal_cases': normal_cases,
            'average_confidence': _average(confidence_values),
            'average_processing_time_ms': _average(processing_seconds) * 1000 if processing_seconds else 0,
            'confirmed_count': confirmed_count,
            'rejected_count': rejected_count,
            'pending_review_count': pending_review_count,
        },
        'weekly_trend': weekly_trend,
        'recent_activity': recent_activity,
    }


@router.get('/dashboard/admin')
def admin_dashboard_stats(current_user: User = Depends(require_roles(UserRole.admin)), db: Session = Depends(get_db)) -> dict:
    predictions = db.scalars(
        select(Prediction)
        .options(
            joinedload(Prediction.results),
            joinedload(Prediction.patient_info),
            joinedload(Prediction.doctor_review),
            joinedload(Prediction.processing_log),
        )
        .order_by(Prediction.created_at.desc())
    ).all()

    if not predictions:
        return _build_mock_dashboard(current_user)

    total_cases = len(predictions)
    completed_cases = sum(1 for item in predictions if item.status == ProcessingStatus.done)
    pending_cases = sum(1 for item in predictions if item.status in {ProcessingStatus.queued, ProcessingStatus.processing})
    failed_cases = sum(1 for item in predictions if item.status == ProcessingStatus.failed)

    done_items = [item for item in predictions if item.status == ProcessingStatus.done]
    pneumonia_cases = sum(1 for item in done_items if item.results and item.results.prediction == PredictionLabel.pneumonia)
    normal_cases = sum(1 for item in done_items if item.results and item.results.prediction == PredictionLabel.normal)

    confidence_values = [float(item.results.confidence * 100) for item in done_items if item.results and item.results.confidence is not None]
    processing_seconds = [float(item.processing_log.processing_time_ms / 1000) for item in done_items if item.processing_log and item.processing_log.processing_time_ms is not None]

    confirmed_count = sum(1 for item in predictions if item.doctor_review and item.doctor_review.doctor_confirmed is True)
    rejected_count = sum(1 for item in predictions if item.doctor_review and item.doctor_review.doctor_confirmed is False)
    pending_review_count = sum(1 for item in predictions if not item.doctor_review or item.doctor_review.doctor_confirmed is None)

    return {
        'user_id': current_user.id,
        'is_mock': False,
        'summary': {
            'total_users': db.scalar(select(func.count()).select_from(User)) or 0,
            'total_cases': total_cases,
            'completed_cases': completed_cases,
            'pending_cases': pending_cases,
            'failed_cases': failed_cases,
            'pneumonia_cases': pneumonia_cases,
            'normal_cases': normal_cases,
            'average_confidence': _average(confidence_values),
            'average_processing_time_ms': _average(processing_seconds) * 1000 if processing_seconds else 0,
            'confirmed_count': confirmed_count,
            'rejected_count': rejected_count,
            'pending_review_count': pending_review_count,
        },
    }
