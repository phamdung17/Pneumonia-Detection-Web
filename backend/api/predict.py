from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from ..auth.dependencies import get_current_user
from ..config import get_settings
from ..database.connection import get_db
from ..database.crud import create_prediction, get_prediction_by_id, get_prediction_by_task_id
from ..database.models import ProcessingStatus, User
from ..database.helpers import get_prediction_full, create_prediction_doctor_review, create_prediction_patient_info
from ..models.pipeline import ensure_models_ready
from ..schemas import ConfirmRequest, MessageResponse, NoteRequest, PatientInfoRequest, PredictionResult
from ..utils.errors import NotFoundAppError
from ..utils.file import resolve_asset_path, save_upload_file
from ..utils.pdf import build_prediction_pdf
from ..utils.rate_limit import check_rate_limit
from ..worker.task_state import task_state_store
from ..worker.tasks import run_prediction_task
from ..worker.websocket import manager

import asyncio
from uuid import uuid4


router = APIRouter(prefix='/api/predict', tags=['predict'])
settings = get_settings()


def serialize_prediction(prediction) -> PredictionResult:
    """Serialize prediction combining data from split tables"""
    file_name = Path(prediction.file_path).name
    original_url = f'/static/{prediction.task_id}/{file_name}'

    # Get related data from split tables
    patient_info = prediction.patient_info
    results = prediction.results
    analysis = prediction.analysis
    doctor_review = prediction.doctor_review
    processing_log = prediction.processing_log

    heatmap_url = None
    if analysis and (analysis.heatmap_dn_path or Path(prediction.file_path).with_name('heatmap.jpg').exists()):
        heatmap_url = f'/static/{prediction.task_id}/heatmap.jpg'

    return PredictionResult(
        id=prediction.id,
        task_id=prediction.task_id,
        status=prediction.status,
        patient_name=patient_info.patient_name if patient_info else None,
        patient_age=patient_info.patient_age if patient_info else None,
        patient_gender=patient_info.patient_gender if patient_info else None,
        technician_name=patient_info.technician_name if patient_info else None,
        performed_at=patient_info.performed_at if patient_info else None,
        prediction=results.prediction.value if results and results.prediction else None,
        confidence=results.confidence if results else None,
        probability=results.prob_dn if results else None,
        original_url=original_url,
        heatmap_url=heatmap_url,
        doctor_note=doctor_review.doctor_note if doctor_review else None,
        doctor_confirmed=doctor_review.doctor_confirmed if doctor_review else None,
        processing_time_ms=processing_log.processing_time_ms if processing_log else None,
        created_at=prediction.created_at,
        completed_at=processing_log.completed_at if processing_log else None,
    )


def build_prediction_envelope(prediction) -> dict[str, Any]:
    state = task_state_store.get(prediction.task_id)
    if state:
        if prediction.status == ProcessingStatus.done:
            state['stage'] = 'final'
            state['status'] = 'done'
            state['data'] = serialize_prediction(prediction).model_dump(mode='json')
            state['predictionId'] = str(prediction.id)
            state['prediction_id'] = prediction.id
        elif prediction.status == ProcessingStatus.failed:
            state['stage'] = 'error'
            state['status'] = 'failed'
            state['data'] = {'message': prediction.error_message or 'Inference failed'}
            state['predictionId'] = None
        return state

    if prediction.status == ProcessingStatus.done:
        return {
            'stage': 'final',
            'status': 'done',
            'data': serialize_prediction(prediction).model_dump(mode='json'),
            'predictionId': str(prediction.id),
            'prediction_id': prediction.id,
        }
    if prediction.status == ProcessingStatus.failed:
        return {
            'stage': 'error',
            'status': 'failed',
            'data': {'message': prediction.error_message or 'Inference failed'},
            'predictionId': None,
            'prediction_id': None,
        }
    if prediction.status == ProcessingStatus.processing:
        return {
            'stage': 'T1',
            'status': 'running',
            'data': {'message': 'DenseNet-121 analyzing image...', 'progress': 45},
            'predictionId': None,
            'prediction_id': None,
        }
    return {
        'stage': 'queued',
        'status': 'queued',
        'data': {'message': 'Task queued', 'progress': 0},
        'predictionId': None,
        'prediction_id': None,
    }


@router.post('/', response_model=dict)
async def submit_prediction(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    check_rate_limit(f'ratelimit:predict:{current_user.id}', 20, 60)
    ensure_models_ready(require_gradcam=False)
    task_id = str(uuid4())
    filename, file_path = await save_upload_file(file, task_id)
    prediction = create_prediction(db, user_id=current_user.id, task_id=task_id, filename=filename, file_path=file_path)
    task_state_store.set(
        task_id,
        {
            'stage': 'queued',
            'status': 'queued',
            'data': {'message': 'Task queued', 'progress': 0},
            'predictionId': None,
            'prediction_id': None,
        },
    )
    asyncio.create_task(run_prediction_task(prediction.id, task_id))
    return {'task_id': task_id}


@router.get('/{task_id}')
def get_prediction(task_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any] | PredictionResult:
    prediction = get_prediction_by_task_id(db, task_id)
    if not prediction or prediction.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
    # Load full prediction with all related data
    prediction = get_prediction_full(db, prediction.id)
    if settings.enable_mock_predict:
        return build_prediction_envelope(prediction)
    return serialize_prediction(prediction)


@router.put('/{prediction_id}/note', response_model=MessageResponse)
def update_note(prediction_id: int, payload: NoteRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    prediction = get_prediction_by_id(db, prediction_id)
    if not prediction or prediction.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
    create_prediction_doctor_review(db, prediction.id, doctor_note=payload.note)
    db.commit()
    return MessageResponse(message='Note updated')


@router.put('/{prediction_id}/confirm', response_model=MessageResponse)
def confirm_prediction(prediction_id: int, payload: ConfirmRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    prediction = get_prediction_by_id(db, prediction_id)
    if not prediction or prediction.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
    create_prediction_doctor_review(db, prediction.id, doctor_confirmed=payload.confirmed)
    db.commit()
    return MessageResponse(message='Confirmation updated')


@router.put('/{prediction_id}/patient', response_model=MessageResponse)
def update_patient_info(prediction_id: int, payload: PatientInfoRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    prediction = get_prediction_by_id(db, prediction_id)
    if not prediction or prediction.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
    create_prediction_patient_info(
        db, prediction.id,
        patient_name=payload.patient_name,
        patient_age=payload.patient_age,
        patient_gender=payload.patient_gender,
        technician_name=payload.technician_name,
        performed_at=payload.performed_at,
    )
    db.commit()
    return MessageResponse(message='Patient info updated')


@router.get('/{prediction_id}/pdf', response_class=Response)
def get_prediction_pdf(prediction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prediction = get_prediction_by_id(db, prediction_id)
    if not prediction or prediction.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
    prediction = get_prediction_full(db, prediction.id)
    pdf_content = build_prediction_pdf(prediction)
    headers = {'Content-Disposition': f'attachment; filename=prediction_{prediction.task_id}.pdf'}
    return Response(content=pdf_content, media_type='application/pdf', headers=headers)


@router.websocket('/ws/{task_id}')
async def websocket_prediction(websocket: WebSocket, task_id: str, current_user: User = Depends(get_current_user)):
    await manager.connect(task_id, websocket)
    state = task_state_store.get(task_id)
    if state:
        await websocket.send_json(state)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(task_id, websocket)


@router.delete('/{prediction_id}')
def delete_prediction(prediction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    prediction = get_prediction_by_id(db, prediction_id)
    if not prediction or prediction.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
    db.delete(prediction)
    db.commit()
    return MessageResponse(message='Prediction deleted')
