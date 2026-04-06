from __future__ import annotations

import asyncio
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Request, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_current_user
from backend.database.connection import get_db
from backend.database.crud import create_batch_item, create_batch_job, create_prediction, get_prediction_by_id, get_prediction_by_task_id
from backend.database.models import BatchJob, ProcessingStatus, User
from backend.models.pipeline import ensure_models_ready
from backend.schemas import BatchItemRead, BatchProgressResponse, BatchResponse, ConfirmRequest, MessageResponse, NoteRequest, PredictionResult
from backend.utils.errors import NotFoundAppError
from backend.utils.file import resolve_asset_path, save_upload_file
from backend.utils.pdf import build_prediction_pdf
from backend.utils.rate_limit import check_rate_limit
from backend.worker.tasks import run_prediction_task
from backend.worker.websocket import manager


router = APIRouter(prefix='/api/predict', tags=['predict'])


def serialize_prediction(prediction) -> PredictionResult:
    task_dir = Path(prediction.file_path).parent
    heatmap_url = None
    if (task_dir / 'heatmap.jpg').exists():
        heatmap_url = f'/static/{prediction.task_id}/heatmap.jpg'
    elif prediction.heatmap_dn_path:
        heatmap_url = f'/static/{prediction.task_id}/heatmap.jpg'

    return PredictionResult(
        id=prediction.id,
        task_id=prediction.task_id,
        status=prediction.status,
        prediction=prediction.prediction.value if prediction.prediction else None,
        confidence=prediction.confidence,
        heatmap_url=heatmap_url,
        doctor_note=prediction.doctor_note,
        doctor_confirmed=prediction.doctor_confirmed,
        processing_time_ms=prediction.processing_time_ms,
        created_at=prediction.created_at,
        completed_at=prediction.completed_at,
    )


@router.post('/', response_model=dict)
async def submit_prediction(request: Request, file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    check_rate_limit(f'ratelimit:predict:{current_user.id}', 20, 60)
    ensure_models_ready()
    task_id = str(uuid4())
    filename, file_path = await save_upload_file(file, task_id)
    prediction = create_prediction(db, user_id=current_user.id, task_id=task_id, filename=filename, file_path=file_path)
    asyncio.create_task(run_prediction_task(prediction.id, task_id))
    return {'task_id': task_id}


@router.post('/batch', response_model=BatchResponse)
async def submit_batch(request: Request, files: list[UploadFile] = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> BatchResponse:
    check_rate_limit(f'ratelimit:batch:{current_user.id}', 5, 60)
    ensure_models_ready()
    batch = create_batch_job(db, user_id=current_user.id, job_name=f'batch-{uuid4()}', total=len(files))
    task_ids: list[str] = []
    for index, file in enumerate(files, start=1):
        task_id = str(uuid4())
        filename, file_path = await save_upload_file(file, task_id)
        prediction = create_prediction(db, user_id=current_user.id, task_id=task_id, filename=filename, file_path=file_path)
        create_batch_item(db, batch_id=batch.id, prediction_id=prediction.id, filename=filename, queue_position=index)
        task_ids.append(task_id)
        asyncio.create_task(run_prediction_task(prediction.id, task_id))
    batch.status = ProcessingStatus.processing
    db.add(batch)
    db.commit()
    return BatchResponse(batch_id=batch.id, task_ids=task_ids)


@router.get('/batch/{batch_id}', response_model=BatchProgressResponse)
def get_batch(batch_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> BatchProgressResponse:
    batch = db.get(BatchJob, batch_id)
    if not batch or batch.user_id != current_user.id:
        raise NotFoundAppError('Batch not found')
    items = [BatchItemRead(id=item.id, prediction_id=item.prediction_id, filename=item.filename, status=item.status, queue_position=item.queue_position, error_message=item.error_message) for item in batch.items]
    return BatchProgressResponse(completed=batch.completed, total=batch.total, items=items)


@router.get('/{task_id}', response_model=PredictionResult)
def get_prediction(task_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> PredictionResult:
    prediction = get_prediction_by_task_id(db, task_id)
    if not prediction or prediction.user_id != current_user.id:
        raise NotFoundAppError('Prediction not found')
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
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(task_id, websocket)
