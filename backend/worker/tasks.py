from __future__ import annotations

from datetime import datetime
from time import perf_counter

from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.database.crud import get_prediction_by_id
from backend.database.models import ProcessingStatus
from backend.models.pipeline import run_pipeline
from backend.utils.logging import error_logger
from backend.worker.websocket import manager


async def run_prediction_task(prediction_id: int, task_id: str) -> None:
    db: Session = SessionLocal()
    started_at = perf_counter()
    try:
        prediction = get_prediction_by_id(db, prediction_id)
        if not prediction:
            return
        prediction.status = ProcessingStatus.processing
        db.add(prediction)
        db.commit()
        await manager.broadcast(task_id, {'stage': 'T0', 'status': 'running', 'message': 'UNet dang crop phoi...'})
        result = run_pipeline(task_id, prediction.file_path)
        await manager.broadcast(task_id, {'stage': 'T0', 'status': 'done', 'dice_score': result['dice_score']})
        await manager.broadcast(task_id, {'stage': 'T1', 'status': 'done', 'prob_dn': result['prob_dn'], 'prob_eff': result['prob_eff'], 'ensemble': result['ensemble_status'].value if result['ensemble_status'] else 'NORMAL'})
        await manager.broadcast(task_id, {'stage': 'T1.5', 'status': 'done', 'heatmap_ready': True})
        if result['disease_type'] and result['disease_type'].value != 'NONE':
            await manager.broadcast(task_id, {'stage': 'T2', 'status': 'done', 'disease_type': result['disease_type'].value})
        for key, value in result.items():
            if key != 'file_path':
                setattr(prediction, key, value)
        prediction.status = ProcessingStatus.done
        prediction.completed_at = datetime.utcnow()
        prediction.processing_time_ms = int((perf_counter() - started_at) * 1000)
        for item in prediction.batch_items:
            item.status = ProcessingStatus.done
            if item.batch:
                item.batch.completed += 1
                if item.batch.completed + item.batch.failed >= item.batch.total:
                    item.batch.status = ProcessingStatus.done
                    item.batch.finished_at = datetime.utcnow()
                db.add(item.batch)
            db.add(item)
        db.add(prediction)
        db.commit()
        await manager.broadcast(task_id, {'stage': 'final', 'status': 'done', 'prediction_id': prediction.id})
    except Exception as exc:
        error_logger.exception('prediction_task_failed prediction_id=%s', prediction_id)
        prediction = get_prediction_by_id(db, prediction_id)
        if prediction:
            prediction.status = ProcessingStatus.failed
            prediction.error_message = str(exc)
            for item in prediction.batch_items:
                item.status = ProcessingStatus.failed
                item.error_message = str(exc)
                if item.batch:
                    item.batch.failed += 1
                    if item.batch.completed + item.batch.failed >= item.batch.total:
                        item.batch.status = ProcessingStatus.failed
                        item.batch.finished_at = datetime.utcnow()
                    db.add(item.batch)
                db.add(item)
            db.add(prediction)
            db.commit()
        await manager.broadcast(task_id, {'stage': 'error', 'status': 'failed', 'message': str(exc)})
    finally:
        db.close()
