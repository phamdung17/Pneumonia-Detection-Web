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

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
WEIGHTS_DIR = BASE_DIR / 'weights'


def _disable_inplace_relu(module: nn.Module) -> None:
    for child in module.modules():
        if isinstance(child, nn.ReLU):
            child.inplace = False


class DenseNetBinaryClassifier(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        base = models.densenet121(weights=None)
        self.features = base.features
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.drop = nn.Dropout(p=0.4)
        self.head = nn.Linear(1024, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feat = self.features(x)
        feat = F.relu(feat, inplace=False)
        feat = self.pool(feat).flatten(1)
        feat = self.drop(feat)
        return self.head(feat)


class ModelRegistry:
    def __init__(self) -> None:
        self.loaded = False
        self.device = DEVICE
        self.torch_model: DenseNetBinaryClassifier | None = None
        self.model_status = {
            'torch': False,
        }

    def load(self) -> dict[str, bool]:
        if self.model_status['torch']:
            self.loaded = True
            return dict(self.model_status)
        start = perf_counter()
        self._load_torch_model()
        self.loaded = self.model_status['torch']
        performance_logger.info(
            'models_loaded duration_ms=%s device=%s torch=%s',
            int((perf_counter() - start) * 1000),
            self.device,
            self.model_status['torch'],
        )
        return dict(self.model_status)

    def _load_torch_model(self) -> None:
        if self.torch_model is not None:
            self.model_status['torch'] = True
            return
        weights_path = WEIGHTS_DIR / 'densenet_best.pth'
        if not weights_path.exists():
            error_logger.error('torch_weights_missing path=%s', weights_path)
            self.model_status['torch'] = False
            return
        try:
            checkpoint = torch.load(weights_path, map_location='cpu', weights_only=False)
            state_dict = checkpoint.get('model_state', checkpoint)
            model = DenseNetBinaryClassifier()
            model.load_state_dict(state_dict, strict=True)
            _disable_inplace_relu(model)
            model.to(self.device)
            model.eval()
            self.torch_model = model
            self.model_status['torch'] = True
        except Exception as exc:
            error_logger.exception('torch_model_load_failed path=%s error=%s', weights_path, exc)
            self.model_status['torch'] = False

    def health(self) -> dict[str, bool]:
        return {
            'loaded': self.model_status['torch'],
            'torch': self.model_status['torch'],
        }

    def inference_test_ms(self) -> int | None:
        if self.torch_model is None:
            return None
        dummy = np.zeros((1, 3, 224, 224), dtype=np.float32)
        tensor = torch.from_numpy(dummy).to(self.device)
        start = perf_counter()
        with torch.inference_mode():
            self.torch_model(tensor)
        return int((perf_counter() - start) * 1000)


model_registry = ModelRegistry()
