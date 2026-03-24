from __future__ import annotations

from pathlib import Path
from time import perf_counter

import torch
import torch.nn as nn
from torchvision import models

from backend.config import BASE_DIR
from backend.utils.logging import performance_logger


DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
WEIGHTS_DIR = BASE_DIR / 'weights'


def _disable_inplace_relu(module: nn.Module) -> None:
    for child in module.modules():
        if isinstance(child, nn.ReLU):
            child.inplace = False



class DoubleConv(nn.Module):
    def __init__(self, in_channels: int, out_channels: int) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class UNet(nn.Module):
    def __init__(self, in_channels: int = 3, out_channels: int = 1, features: list[int] | None = None) -> None:
        super().__init__()
        feats = features or [64, 128, 256, 512]
        self.downs = nn.ModuleList()
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)
        current = in_channels
        for feat in feats:
            self.downs.append(DoubleConv(current, feat))
            current = feat
        self.bottleneck = DoubleConv(feats[-1], feats[-1] * 2)
        self.ups = nn.ModuleList()
        rev_feats = list(reversed(feats))
        up_in = feats[-1] * 2
        for feat in rev_feats:
            self.ups.append(nn.ConvTranspose2d(up_in, feat, kernel_size=2, stride=2))
            self.ups.append(DoubleConv(feat * 2, feat))
            up_in = feat
        self.final = nn.Conv2d(feats[0], out_channels, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        skips: list[torch.Tensor] = []
        for down in self.downs:
            x = down(x)
            skips.append(x)
            x = self.pool(x)
        x = self.bottleneck(x)
        skips = skips[::-1]
        for idx in range(0, len(self.ups), 2):
            x = self.ups[idx](x)
            skip = skips[idx // 2]
            if x.shape[-2:] != skip.shape[-2:]:
                x = torch.nn.functional.interpolate(x, size=skip.shape[-2:], mode='bilinear', align_corners=False)
            x = torch.cat([skip, x], dim=1)
            x = self.ups[idx + 1](x)
        return self.final(x)


def build_densenet(out_features: int) -> nn.Module:
    model = models.densenet121(weights=None)
    model.classifier = nn.Sequential(
        nn.Identity(),
        nn.Dropout(p=0.25),
        nn.Identity(),
        nn.Linear(1024, 256),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.25),
        nn.Linear(256, out_features),
    )
    return model


def build_efficientnet() -> nn.Module:
    model = models.efficientnet_b0(weights=None)
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2),
        nn.Linear(1280, 256),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.25),
        nn.Linear(256, 1),
    )
    return model


class ModelRegistry:
    def __init__(self) -> None:
        self.loaded = False
        self.device = DEVICE
        self.models: dict[str, nn.Module | None] = {
            'unet': None,
            'densenet_t1': None,
            'effnet_t1': None,
            'densenet_t2': None,
        }
        self.model_status = {key: False for key in self.models}

    def _load_state(self, model: nn.Module, path: Path) -> nn.Module:
        state_dict = torch.load(path, map_location='cpu')
        model.load_state_dict(state_dict, strict=True)
        _disable_inplace_relu(model)
        model.to(self.device)
        model.eval()
        return model

    def load(self) -> dict[str, bool]:
        if self.loaded:
            return self.model_status
        start = perf_counter()
        self.models['unet'] = self._load_state(UNet(), WEIGHTS_DIR / 'lung_unet_best.pth')
        self.model_status['unet'] = True
        self.models['densenet_t1'] = self._load_state(build_densenet(1), WEIGHTS_DIR / 'densenet_t1_best.pth')
        self.model_status['densenet_t1'] = True
        self.models['effnet_t1'] = self._load_state(build_efficientnet(), WEIGHTS_DIR / 'effnet_t1_best.pth')
        self.model_status['effnet_t1'] = True
        self.models['densenet_t2'] = self._load_state(build_densenet(3), WEIGHTS_DIR / 'densenet_t2_best.pth')
        self.model_status['densenet_t2'] = True
        self._warmup()
        self.loaded = True
        performance_logger.info('models_loaded duration_ms=%s device=%s', int((perf_counter() - start) * 1000), self.device)
        return self.model_status

    def _warmup(self) -> None:
        x = torch.zeros(1, 3, 224, 224, device=self.device)
        with torch.inference_mode():
            assert self.models['unet'] is not None
            assert self.models['densenet_t1'] is not None
            assert self.models['effnet_t1'] is not None
            assert self.models['densenet_t2'] is not None
            self.models['unet'](x)
            self.models['densenet_t1'](x)
            self.models['effnet_t1'](x)
            self.models['densenet_t2'](x)

    def get(self, key: str) -> nn.Module:
        model = self.models.get(key)
        if model is None:
            raise RuntimeError(f'Model {key} is not loaded')
        return model

    def health(self) -> dict[str, bool]:
        return dict(self.model_status)


model_registry = ModelRegistry()
