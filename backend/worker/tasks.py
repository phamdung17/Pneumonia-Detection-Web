from __future__ import annotations

import asyncio
from datetime import datetime
from time import perf_counter

from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.database.crud import create_audit_log, get_prediction_by_id
from backend.database.helpers import (
    create_prediction_results,
    create_prediction_analysis,
    create_prediction_processing_log,
)
from backend.database.models import PredictionLabel, ProcessingStatus
from backend.models.pipeline import run_pipeline
from backend.utils.logging import error_logger, performance_logger
from backend.worker.task_state import task_state_store
from backend.worker.websocket import manager

_prediction_semaphore = asyncio.Semaphore(1)


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
        queue_wait_started = perf_counter()
        if _prediction_semaphore.locked():
            task_state_store.set(
                task_id,
                {
                    'stage': 'queued',
                    'status': 'queued',
                    'data': {
                        'message': 'Waiting for inference slot...',
                        'progress': 5,
                    },
                    'predictionId': None,
                },
            )
            await manager.broadcast(
                task_id,
                {
                    'stage': 'queued',
                    'status': 'queued',
                    'data': {
                        'message': 'Waiting for inference slot...',
                        'progress': 5,
                    },
                    'predictionId': None,
                },
            )

        async with _prediction_semaphore:
            performance_logger.info(
                'prediction_started task_id=%s prediction_id=%s queue_wait_ms=%s',
                task_id,
                prediction_id,
                int((perf_counter() - queue_wait_started) * 1000),
            )
            pipeline_result = await asyncio.to_thread(run_pipeline, task_id, prediction.file_path)
        prediction_label = pipeline_result['prediction']
        confidence = float(pipeline_result['confidence'])
        probability = float(pipeline_result['probability']) if pipeline_result.get('probability') is not None else None

        task_state_store.set(
            task_id,
            {
                'stage': 'T1',
                'status': 'done',
                'data': {
                    'prediction': prediction_label.value,
                    'confidence': round(confidence, 4),
                    'probability': round(probability, 4) if probability is not None else None,
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
                    'probability': round(probability, 4) if probability is not None else None,
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

        prediction.status = ProcessingStatus.done
        db.add(prediction)
        db.flush()

        # Save results to prediction_results table
        create_prediction_results(
            db,
            prediction.id,
            prediction=prediction_label,
            confidence=confidence,
            prob_dn=probability,
        )

        # Save analysis to prediction_analysis table
        create_prediction_analysis(
            db,
            prediction.id,
            lesion_pct=float(pipeline_result['lesion_pct']) if pipeline_result.get('lesion_pct') is not None else None,
            bbox_x1=int(pipeline_result['bbox_x1']) if pipeline_result.get('bbox_x1') is not None else None,
            bbox_y1=int(pipeline_result['bbox_y1']) if pipeline_result.get('bbox_y1') is not None else None,
            bbox_x2=int(pipeline_result['bbox_x2']) if pipeline_result.get('bbox_x2') is not None else None,
            bbox_y2=int(pipeline_result['bbox_y2']) if pipeline_result.get('bbox_y2') is not None else None,
            dice_score=float(pipeline_result['dice_score']) if pipeline_result.get('dice_score') is not None else None,
            heatmap_dn_path=str(pipeline_result['heatmap_dn_path']) if pipeline_result.get('heatmap_dn_path') else None,
            heatmap_eff_path=str(pipeline_result['heatmap_eff_path']) if pipeline_result.get('heatmap_eff_path') else None,
            lung_mask_path=str(pipeline_result['lung_mask_path']) if pipeline_result.get('lung_mask_path') else None,
        )

        # Save processing log
        processing_time_ms = int((perf_counter() - started_at) * 1000)
        create_prediction_processing_log(
            db,
            prediction.id,
            error_message=None,
            processing_time_ms=processing_time_ms,
            completed_at=datetime.utcnow(),
        )

        log = create_audit_log(
            db,
            user_id=prediction.user_id,
            action='predict',
            target_type='prediction',
            target_id=str(prediction.id),
            detail={
                'task_id': prediction.task_id,
                'prediction': prediction_label.value,
                'confidence': confidence,
                'probability': probability,
            },
            commit=False,
        )
        db.add(log)

        db.commit()
        performance_logger.info(
            'prediction_finished task_id=%s prediction_id=%s total_ms=%s',
            task_id,
            prediction_id,
            int((perf_counter() - started_at) * 1000),
        )

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
