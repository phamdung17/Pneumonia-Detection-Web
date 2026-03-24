from __future__ import annotations

from pathlib import Path

from fastapi import UploadFile

from backend.config import get_settings
from backend.utils.errors import ValidationAppError


settings = get_settings()
JPEG_MAGIC = b'\xff\xd8\xff'
PNG_MAGIC = b'\x89PNG'
ALLOWED_TYPES = {'image/jpeg': '.jpg', 'image/png': '.png'}
ALLOWED_ASSETS = {'original.jpg', 'original.png', 'cropped.jpg', 'heatmap_dn.jpg', 'heatmap_eff.jpg', 'lung_mask.jpg', 'bbox_overlay.jpg'}


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
