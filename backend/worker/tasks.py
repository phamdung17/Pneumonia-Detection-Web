from __future__ import annotations

from datetime import datetime
from time import perf_counter

from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.database.crud import create_audit_log, get_prediction_by_id
from backend.database.models import DiseaseType, PredictionLabel, ProcessingStatus
from backend.models.pipeline import run_pipeline
from backend.utils.logging import error_logger
from backend.worker.task_state import task_state_store
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

        task_state_store.set(
            task_id,
            {
                'stage': 'T1',
                'status': 'running',
                'data': {
                    'message': 'DenseNet-121 analyzing image...',
                    'progress': 30,
                },
                'predictionId': None,
            },
        )
        await manager.broadcast(
            task_id,
            {
                'stage': 'T1',
                'status': 'running',
                'data': {
                    'message': 'DenseNet-121 analyzing image...',
                    'progress': 30,
                },
                'predictionId': None,
            },
        )
        pipeline_result = run_pipeline(task_id, prediction.file_path)
        prediction_label = pipeline_result['prediction']
        confidence = float(pipeline_result['confidence'])
        disease_type_value = pipeline_result.get('disease_type')
        disease_type = DiseaseType(disease_type_value) if disease_type_value else None
        type_probs = {
            'BACTERIAL': float(pipeline_result['bacterial_prob']) if pipeline_result.get('bacterial_prob') is not None else None,
            'VIRAL': float(pipeline_result['viral_prob']) if pipeline_result.get('viral_prob') is not None else None,
            'COVID': float(pipeline_result['covid_prob']) if pipeline_result.get('covid_prob') is not None else None,
        }
        if prediction_label == PredictionLabel.normal and disease_type is None:
            disease_type = DiseaseType.none

        task_state_store.set(
            task_id,
            {
                'stage': 'T1',
                'status': 'done',
                'data': {
                    'prediction': prediction_label.value,
                    'confidence': round(confidence, 4),
                    'type': {
                        'label': disease_type.value if disease_type else None,
                        'probs': type_probs,
                    },
                    'progress': 60,
                },
                'predictionId': None,
            },
        )
        await manager.broadcast(
            task_id,
            {
                'stage': 'T1',
                'status': 'done',
                'data': {
                    'prediction': prediction_label.value,
                    'confidence': round(confidence, 4),
                    'type': {
                        'label': disease_type.value if disease_type else None,
                        'probs': type_probs,
                    },
                    'progress': 60,
                },
                'predictionId': None,
            },
        )

        task_state_store.set(
            task_id,
            {
                'stage': 'gradcam',
                'status': 'done',
                'data': {
                    'heatmap_ready': bool(pipeline_result.get('heatmap_dn_path')),
                    'progress': 95,
                },
                'predictionId': None,
            },
        )
        await manager.broadcast(
            task_id,
            {
                'stage': 'gradcam',
                'status': 'done',
                'data': {
                    'heatmap_ready': bool(pipeline_result.get('heatmap_dn_path')),
                    'progress': 95,
                },
                'predictionId': None,
            },
        )

        prediction.prediction = prediction_label
        prediction.confidence = confidence
        prediction.prob_dn = float(pipeline_result['prob_dn']) if pipeline_result.get('prob_dn') is not None else None
        prediction.prob_eff = float(pipeline_result['prob_eff']) if pipeline_result.get('prob_eff') is not None else None
        prediction.disease_type = disease_type
        prediction.bacterial_prob = type_probs['BACTERIAL']
        prediction.viral_prob = type_probs['VIRAL']
        prediction.covid_prob = type_probs['COVID']
        prediction.lesion_pct = float(pipeline_result['lesion_pct']) if pipeline_result.get('lesion_pct') is not None else None
        prediction.bbox_x1 = int(pipeline_result['bbox_x1']) if pipeline_result.get('bbox_x1') is not None else None
        prediction.bbox_y1 = int(pipeline_result['bbox_y1']) if pipeline_result.get('bbox_y1') is not None else None
        prediction.bbox_x2 = int(pipeline_result['bbox_x2']) if pipeline_result.get('bbox_x2') is not None else None
        prediction.bbox_y2 = int(pipeline_result['bbox_y2']) if pipeline_result.get('bbox_y2') is not None else None
        prediction.dice_score = float(pipeline_result['dice_score']) if pipeline_result.get('dice_score') is not None else None
        prediction.heatmap_dn_path = str(pipeline_result['heatmap_dn_path']) if pipeline_result.get('heatmap_dn_path') else None
        prediction.heatmap_eff_path = str(pipeline_result['heatmap_eff_path']) if pipeline_result.get('heatmap_eff_path') else None
        prediction.lung_mask_path = str(pipeline_result['lung_mask_path']) if pipeline_result.get('lung_mask_path') else None
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
            detail={
                'task_id': prediction.task_id,
                'prediction': prediction.prediction.value,
                'confidence': prediction.confidence,
                'type': prediction.disease_type.value if prediction.disease_type else None,
            },
            commit=False,
        )
        db.add(log)

        db.add(prediction)
        db.commit()

        task_state_store.set(
            task_id,
            {
                'stage': 'final',
                'status': 'done',
                'data': {
                    'progress': 100,
                },
                'predictionId': str(prediction.id),
                'prediction_id': prediction.id,
            },
        )
        await manager.broadcast(
            task_id,
            {
                'stage': 'final',
                'status': 'done',
                'data': {
                    'progress': 100,
                },
                'predictionId': str(prediction.id),
                'prediction_id': prediction.id,
            },
        )
    except Exception as exc:
        db.rollback()
        error_logger.exception('prediction_task_failed prediction_id=%s', prediction_id)
        prediction = get_prediction_by_id(db, prediction_id)
        if prediction:
            prediction.status = ProcessingStatus.failed
            prediction.error_message = str(exc)
            db.add(prediction)
            db.commit()
        task_state_store.set(
            task_id,
            {
                'stage': 'error',
                'status': 'failed',
                'data': {
                    'message': str(exc),
                },
                'predictionId': None,
            },
        )
        await manager.broadcast(
            task_id,
            {
                'stage': 'error',
                'status': 'failed',
                'data': {
                    'message': str(exc),
                },
                'predictionId': None,
            },
        )
    finally:
        db.close()
