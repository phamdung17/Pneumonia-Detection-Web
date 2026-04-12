from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_current_user
from backend.config import get_settings
from backend.database.connection import get_db
from backend.database.crud import create_prediction, get_prediction_by_id, get_prediction_by_task_id
from backend.database.models import DiseaseType, ProcessingStatus, User
from backend.models.pipeline import ensure_models_ready
from backend.schemas import ConfirmRequest, MessageResponse, NoteRequest, PatientInfoRequest, PredictionResult, PredictionTypeProbabilities, PredictionTypeResult
from backend.utils.errors import NotFoundAppError
from backend.utils.file import resolve_asset_path, save_upload_file
from backend.utils.pdf import build_prediction_pdf
from backend.utils.rate_limit import check_rate_limit
from backend.worker.task_state import task_state_store
from backend.worker.tasks import run_prediction_task
from backend.worker.websocket import manager

import asyncio
from uuid import uuid4


router = APIRouter(prefix='/api/predict', tags=['predict'])
settings = get_settings()


def build_prediction_type(prediction) -> PredictionTypeResult | None:
    if prediction.disease_type is None and prediction.bacterial_prob is None and prediction.viral_prob is None and prediction.covid_prob is None:
        return None

    label = prediction.disease_type.value if prediction.disease_type else None
    return PredictionTypeResult(
        label=label,
        probs=PredictionTypeProbabilities(
            BACTERIAL=prediction.bacterial_prob,
            VIRAL=prediction.viral_prob,
            COVID=prediction.covid_prob,
        ),
    )


def serialize_prediction(prediction) -> PredictionResult:
    file_name = Path(prediction.file_path).name
    original_url = f'/static/{prediction.task_id}/{file_name}'

    heatmap_url = None
    if Path(prediction.file_path).with_name('heatmap.jpg').exists() or prediction.heatmap_dn_path:
        heatmap_url = f'/static/{prediction.task_id}/heatmap.jpg'

    type_result = build_prediction_type(prediction)

    return PredictionResult(
        id=prediction.id,
        task_id=prediction.task_id,
        status=prediction.status,
        patient_name=prediction.patient_name,
        patient_age=prediction.patient_age,
        patient_gender=prediction.patient_gender,
        technician_name=prediction.technician_name,
        performed_at=prediction.performed_at,
        prediction=prediction.prediction.value if prediction.prediction else None,
        confidence=prediction.confidence,
        original_url=original_url,
        heatmap_url=heatmap_url,
        doctor_note=prediction.doctor_note,
        doctor_confirmed=prediction.doctor_confirmed,
        processing_time_ms=prediction.processing_time_ms,
        created_at=prediction.created_at,
        completed_at=prediction.completed_at,
        type=type_result,
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
    ensure_models_ready()
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
    if settings.enable_mock_predict:
        return build_prediction_envelope(prediction)
    return serialize_prediction(prediction)


@router.put('/{prediction_id}/note', response_model=MessageResponse)
def update_note(prediction_id: int, payload: NoteRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    prediction = get_prediction_by_id(db, prediction_id)
    if not prediction or prediction.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
    prediction.doctor_note = payload.note
    db.add(prediction)
    db.commit()
    return MessageResponse(message='Note updated')


@router.put('/{prediction_id}/confirm', response_model=MessageResponse)
def confirm_prediction(prediction_id: int, payload: ConfirmRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    prediction = get_prediction_by_id(db, prediction_id)
    if not prediction or prediction.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
    prediction.doctor_confirmed = payload.confirmed
    db.add(prediction)
    db.commit()
    return MessageResponse(message='Confirmation updated')


@router.put('/{prediction_id}/patient', response_model=MessageResponse)
def update_patient_info(prediction_id: int, payload: PatientInfoRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    prediction = get_prediction_by_id(db, prediction_id)
    if not prediction or prediction.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(prediction, field, value)
    db.add(prediction)
    db.commit()
    return MessageResponse(message='Patient info updated')


@router.get('/{prediction_id}/export')
def export_prediction(prediction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    prediction = get_prediction_by_id(db, prediction_id)
    if not prediction or prediction.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
    pdf_content = build_prediction_pdf(prediction)
    headers = {'Content-Disposition': f'attachment; filename=XR-{prediction.id}.pdf'}
    return Response(content=pdf_content, media_type='application/pdf', headers=headers)


@router.get('/{task_id}/asset/{filename}')
def get_prediction_asset(task_id: str, filename: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> FileResponse:
    prediction = get_prediction_by_task_id(db, task_id)
    if not prediction or prediction.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
    asset_path = resolve_asset_path(task_id, filename)
    return FileResponse(path=asset_path)


@router.websocket('/ws/{task_id}')
async def prediction_ws(websocket: WebSocket, task_id: str) -> None:
    await manager.connect(task_id, websocket)
    state = task_state_store.get(task_id)
    if state:
        await websocket.send_json(state)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(task_id, websocket)
