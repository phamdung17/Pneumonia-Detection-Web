from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from fastapi import UploadFile

from backend.config import get_settings
from backend.utils.errors import ValidationAppError


settings = get_settings()
JPEG_MAGIC = b'\xff\xd8\xff'
PNG_MAGIC = b'\x89PNG'
ALLOWED_TYPES = {'image/jpeg': '.jpg', 'image/png': '.png'}
ALLOWED_ASSETS = {'original.jpg', 'original.png', 'heatmap.jpg'}


def _validate_xray_like_image(content: bytes) -> None:
    arr = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValidationAppError('Không đọc được dữ liệu ảnh')

    height, width = image.shape[:2]
    if height < 128 or width < 128:
        raise ValidationAppError('Ảnh quá nhỏ để chẩn đoán X-quang (tối thiểu 128x128)')

    aspect_ratio = width / float(height)
    if aspect_ratio < 0.3 or aspect_ratio > 3.2:
        raise ValidationAppError('Tỷ lệ khung hình không phù hợp với ảnh X-quang ngực')

    # Only block images that are strongly colorful; keep grayscale-like images permissive.
    bgr = image.astype(np.float32)
    rg_diff = np.mean(np.abs(bgr[:, :, 2] - bgr[:, :, 1]))
    gb_diff = np.mean(np.abs(bgr[:, :, 1] - bgr[:, :, 0]))
    br_diff = np.mean(np.abs(bgr[:, :, 2] - bgr[:, :, 0]))
    channel_delta = (rg_diff + gb_diff + br_diff) / 3.0
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    saturation = hsv[:, :, 1].astype(np.float32)
    sat_mean = float(np.mean(saturation))
    sat_p90 = float(np.percentile(saturation, 90))
    if channel_delta > 32.0 and sat_mean > 55.0 and sat_p90 > 105.0:
        raise ValidationAppError('Ảnh tải lên có màu sắc mạnh, không giống X-quang ngực')


async def save_upload_file(file: UploadFile, task_id: str) -> tuple[str, str]:
    if file.content_type not in ALLOWED_TYPES:
        raise ValidationAppError('File khong dung dinh dang anh')
    content = await file.read()
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise ValidationAppError('File vuot qua gioi han kich thuoc')
    if file.content_type == 'image/jpeg' and not content.startswith(JPEG_MAGIC):
        raise ValidationAppError('Magic bytes cua JPEG khong hop le')
    if file.content_type == 'image/png' and not content.startswith(PNG_MAGIC):
        raise ValidationAppError('Magic bytes cua PNG khong hop le')

    _validate_xray_like_image(content)

    task_dir = Path(settings.upload_dir) / task_id
    task_dir.mkdir(parents=True, exist_ok=True)
    ext = ALLOWED_TYPES[file.content_type]
    file_path = task_dir / f'original{ext}'
    file_path.write_bytes(content)
    return file.filename or file_path.name, str(file_path)


def resolve_asset_path(task_id: str, filename: str) -> Path:
    if filename not in ALLOWED_ASSETS:
        raise ValidationAppError('Asset khong hop le')
    task_dir = Path(settings.upload_dir) / task_id
    asset_path = task_dir / filename
    if not asset_path.exists():
        raise ValidationAppError('Asset khong ton tai')
    return asset_path
