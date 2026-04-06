from __future__ import annotations

from datetime import datetime
from time import perf_counter

from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.database.crud import create_audit_log, get_prediction_by_id
from backend.database.models import ProcessingStatus
from backend.models.pipeline import classify_image, generate_gradcam
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

        await manager.broadcast(task_id, {'stage': 'T1', 'status': 'running', 'message': 'DenseNet-121 dang phan tich...'})
        classification = classify_image(prediction.file_path)
        await manager.broadcast(
            task_id,
            {
                'stage': 'T1',
                'status': 'done',
                'prediction': classification['prediction'].value,
                'confidence': round(float(classification['confidence']), 4),
            },
        )

        await manager.broadcast(task_id, {'stage': 'gradcam', 'status': 'running', 'message': 'Grad-CAM dang tao heatmap...'})
        heatmap_path = generate_gradcam(prediction.file_path, classification['rgb'])
        await manager.broadcast(task_id, {'stage': 'gradcam', 'status': 'done', 'heatmap_ready': True})

        prediction.prediction = classification['prediction']
        prediction.confidence = float(classification['confidence'])
        prediction.heatmap_dn_path = str(heatmap_path)
        prediction.heatmap_eff_path = None
        prediction.lung_mask_path = None
        prediction.status = ProcessingStatus.done
        prediction.completed_at = datetime.utcnow()
        prediction.processing_time_ms = int((perf_counter() - started_at) * 1000)
        prediction.error_message = None

        log = create_audit_log(
            db,
            user_id=prediction.user_id,
            action='predict',
            target_type='prediction',
            target_id=str(prediction.id),
            detail={'task_id': prediction.task_id, 'prediction': prediction.prediction.value, 'confidence': prediction.confidence},
            commit=False,
        )
        db.add(log)

        for item in prediction.batch_items:
            item.status = ProcessingStatus.done
            item.error_message = None
            if item.batch:
                item.batch.completed += 1
                if item.batch.completed + item.batch.failed >= item.batch.total:
                    item.batch.status = ProcessingStatus.done
                    item.batch.finished_at = datetime.utcnow()
                db.add(item.batch)
            db.add(item)

        db.add(prediction)
        db.commit()

        await manager.broadcast(
            task_id,
            {
                'stage': 'final',
                'status': 'done',
                'prediction_id': prediction.id,
                'processing_time_ms': prediction.processing_time_ms,
            },
        )
    except Exception as exc:
        db.rollback()
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
