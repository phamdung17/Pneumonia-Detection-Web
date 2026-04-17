from __future__ import annotations

from pathlib import Path
from time import perf_counter

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models

from backend.config import BASE_DIR
from backend.utils.logging import error_logger, performance_logger

try:
    import onnxruntime as ort
except Exception:  # pragma: no cover - optional dependency in local dev
    ort = None


DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
WEIGHTS_DIR = BASE_DIR / 'weights'


def _disable_inplace_relu(module: nn.Module) -> None:
    for child in module.modules():
        if isinstance(child, nn.ReLU):
            child.inplace = False


class DenseNetMultiHead(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        base = models.densenet121(weights=None)
        self.backbone = base.features
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.drop = nn.Dropout(p=0.3)
        self.head_binary = nn.Linear(1024, 1)
        self.head_type = nn.Linear(1024, 3)

    @property
    def features(self) -> nn.Module:
        return self.backbone

    def forward(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        feat = self.backbone(x)
        feat = F.relu(feat, inplace=False)
        feat = self.pool(feat).flatten(1)
        feat = self.drop(feat)
        return self.head_binary(feat), self.head_type(feat)


class ModelRegistry:
    def __init__(self) -> None:
        self.loaded = False
        self.device = DEVICE
        self.onnx_session: ort.InferenceSession | None = None
        self.torch_model: DenseNetMultiHead | None = None
        self.model_status = {
            'onnx': False,
            'torch_gradcam': False,
        }

    def load(self) -> dict[str, bool]:
        if self.model_status['onnx'] and self.model_status['torch_gradcam']:
            self.loaded = True
            return dict(self.model_status)
        start = perf_counter()
        self._load_onnx()
        self._load_torch_gradcam()
        self.loaded = self.model_status['onnx'] and self.model_status['torch_gradcam']
        performance_logger.info(
            'models_loaded duration_ms=%s device=%s onnx=%s gradcam=%s',
            int((perf_counter() - start) * 1000),
            self.device,
            self.model_status['onnx'],
            self.model_status['torch_gradcam'],
        )
        return dict(self.model_status)

    def _load_onnx(self) -> None:
        if self.onnx_session is not None:
            self.model_status['onnx'] = True
            return
        if ort is None:
            error_logger.error('onnxruntime_not_available')
            self.model_status['onnx'] = False
            return
        onnx_path = WEIGHTS_DIR / 'densenet_int8.onnx'
        if not onnx_path.exists():
            error_logger.error('onnx_model_missing path=%s', onnx_path)
            self.model_status['onnx'] = False
            return
        providers = ['CPUExecutionProvider']
        available = set(ort.get_available_providers())
        if 'CUDAExecutionProvider' in available:
            providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
        self.onnx_session = ort.InferenceSession(str(onnx_path), providers=providers)
        self.model_status['onnx'] = True

    def _load_torch_gradcam(self) -> None:
        if self.torch_model is not None:
            self.model_status['torch_gradcam'] = True
            return
        weights_path = WEIGHTS_DIR / 'densenet_multihead_best.pth'
        if not weights_path.exists():
            error_logger.error('torch_gradcam_weights_missing path=%s', weights_path)
            self.model_status['torch_gradcam'] = False
            return
        try:
            model = DenseNetMultiHead()
            state_dict = torch.load(weights_path, map_location='cpu')
            model.load_state_dict(state_dict, strict=True)
            _disable_inplace_relu(model)
            model.to(self.device)
            model.eval()
            self.torch_model = model
            self.model_status['torch_gradcam'] = True
        except Exception as exc:
            error_logger.exception('torch_gradcam_load_failed path=%s error=%s', weights_path, exc)
            self.model_status['torch_gradcam'] = False

    def health(self) -> dict[str, bool]:
        return {
            'loaded': self.model_status['onnx'] and self.model_status['torch_gradcam'],
            'onnx': self.model_status['onnx'],
            'torch_gradcam': self.model_status['torch_gradcam'],
        }

    def inference_test_ms(self) -> int | None:
        if self.onnx_session is None:
            return None
        input_name = self.onnx_session.get_inputs()[0].name
        dummy = np.zeros((1, 3, 224, 224), dtype=np.float32)
        start = perf_counter()
        self.onnx_session.run(None, {input_name: dummy})
        return int((perf_counter() - start) * 1000)


model_registry = ModelRegistry()
