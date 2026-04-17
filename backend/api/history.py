from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.api.predict import serialize_prediction
from backend.auth.dependencies import get_current_user
from backend.database.connection import get_db
from backend.database.crud import create_audit_log, get_prediction_by_id, list_predictions_for_user
from backend.database.models import User
from backend.schemas import MessageResponse, PaginatedPredictions, PredictionResult
from backend.utils.errors import NotFoundAppError


router = APIRouter(prefix='/api/history', tags=['history'])


@router.get('/', response_model=PaginatedPredictions)
def history_list(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), prediction: str | None = None, status: str | None = None, date_from: datetime | None = None, date_to: datetime | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> PaginatedPredictions:
    items, total = list_predictions_for_user(db, user_id=current_user.id, page=page, limit=limit, prediction=prediction, status=status, date_from=date_from, date_to=date_to)
    return PaginatedPredictions(items=[serialize_prediction(item) for item in items], total=total, page=page)


@router.get('/{prediction_id}', response_model=PredictionResult)
def history_detail(prediction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> PredictionResult:
    item = get_prediction_by_id(db, prediction_id)
    if not item or item.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
    return serialize_prediction(item)


@router.delete('/{prediction_id}', response_model=MessageResponse)
def history_delete(prediction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    item = get_prediction_by_id(db, prediction_id)
    if not item or item.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')

    create_audit_log(
        db,
        user_id=current_user.id,
        action='delete_prediction',
        target_type='prediction',
        target_id=str(item.id),
        detail={'task_id': item.task_id, 'prediction': item.prediction.value if item.prediction else None},
        commit=False,
    )

    db.delete(item)
    db.commit()
    return MessageResponse(message='History deleted')
