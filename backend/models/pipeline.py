from __future__ import annotations

from pathlib import Path
from time import perf_counter

import cv2
import numpy as np
import torch
import torch.nn.functional as F

from backend.database.models import PredictionLabel
from backend.models.loader import model_registry
from backend.utils.errors import InferenceAppError
from backend.utils.logging import performance_logger


IMAGE_SIZE = 224
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


class GradCAM:
    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.gradients: torch.Tensor | None = None
        self.activations: torch.Tensor | None = None
        self._hooks: list = []
        self._register_hooks()

    def _register_hooks(self) -> None:
        def forward_hook(module, inputs, output):
            self.activations = output

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0]

        self._hooks.append(self.target_layer.register_forward_hook(forward_hook))
        self._hooks.append(self.target_layer.register_full_backward_hook(backward_hook))

    def remove_hooks(self) -> None:
        for hook in self._hooks:
            hook.remove()
        self._hooks.clear()

    def __call__(self, input_tensor: torch.Tensor) -> np.ndarray:
        logit = self.model(input_tensor)
        self.model.zero_grad(set_to_none=True)
        score = logit.sum()
        score.backward()
        if self.gradients is None or self.activations is None:
            raise InferenceAppError('Grad-CAM hooks did not capture gradients/activations')
        weights = self.gradients.mean(dim=[2, 3], keepdim=True)
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = F.relu(cam)
        cam = F.interpolate(cam, size=input_tensor.shape[2:], mode='bilinear', align_corners=False)
        cam = cam.squeeze().detach().cpu().numpy()
        cam_min, cam_max = float(cam.min()), float(cam.max())
        if cam_max - cam_min > 1e-8:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)
        return cam.astype(np.float32)


def _load_rgb(path: str) -> np.ndarray:
    image = cv2.imread(path, cv2.IMREAD_COLOR)
    if image is None:
        raise InferenceAppError(f'Cannot read image: {path}')
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def _preprocess_image(rgb: np.ndarray) -> np.ndarray:
    resized = cv2.resize(rgb, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
    data = resized.astype(np.float32) / 255.0
    data = (data - MEAN) / STD
    chw = np.transpose(data, (2, 0, 1))
    return np.expand_dims(chw, axis=0).astype(np.float32)


def _tensor_for_gradcam(rgb: np.ndarray) -> torch.Tensor:
    data = _preprocess_image(rgb)[0]
    tensor = torch.from_numpy(data).unsqueeze(0)
    return tensor.to(model_registry.device)


def _sigmoid(x: float) -> float:
    return float(1.0 / (1.0 + np.exp(-x)))


def _overlay_heatmap(rgb: np.ndarray, heatmap: np.ndarray, alpha: float = 0.4) -> np.ndarray:
    heatmap = cv2.resize(heatmap, (rgb.shape[1], rgb.shape[0]))
    heat_u8 = np.uint8(255 * np.clip(heatmap, 0, 1))
    colored = cv2.applyColorMap(heat_u8, cv2.COLORMAP_JET)
    colored = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    base = rgb.astype(np.float32) / 255.0
    blended = alpha * colored + (1 - alpha) * base
    return np.uint8(255 * np.clip(blended, 0, 1))


def ensure_models_ready(*, require_gradcam: bool = True) -> None:
    if model_registry.torch_model is None:
        if require_gradcam:
            raise InferenceAppError('DenseNet model is not loaded')
        raise InferenceAppError('Inference model is not loaded')


def classify_image(file_path: str) -> dict[str, float | PredictionLabel | np.ndarray]:
    ensure_models_ready(require_gradcam=False)
    try:
        rgb = _load_rgb(file_path)
        tensor = _tensor_for_gradcam(rgb)
        assert model_registry.torch_model is not None
        with torch.inference_mode():
            output = model_registry.torch_model(tensor)
        binary_logit = float(output.detach().cpu().reshape(-1)[0])
        pneumonia_prob = _sigmoid(binary_logit)
        prediction = PredictionLabel.pneumonia if pneumonia_prob >= 0.5 else PredictionLabel.normal
        confidence = pneumonia_prob if prediction == PredictionLabel.pneumonia else (1.0 - pneumonia_prob)

        return {
            'rgb': rgb,
            'prediction': prediction,
            'confidence': float(confidence),
            'pneumonia_prob': float(pneumonia_prob),
        }
    except InferenceAppError:
        raise
    except Exception as exc:
        raise InferenceAppError(f'Inference classification failed: {exc}') from exc


def generate_gradcam(file_path: str, rgb: np.ndarray) -> str | None:
    if model_registry.torch_model is None:
        return None
    ensure_models_ready(require_gradcam=True)
    try:
        task_dir = Path(file_path).parent
        cam_input = _tensor_for_gradcam(rgb).requires_grad_(True)
        assert model_registry.torch_model is not None
        gradcam = GradCAM(model_registry.torch_model, model_registry.torch_model.features.denseblock4)
        try:
            heatmap = gradcam(cam_input)
        finally:
            gradcam.remove_hooks()

        overlay = _overlay_heatmap(rgb, heatmap, alpha=0.4)
        heatmap_path = task_dir / 'heatmap.jpg'
        cv2.imwrite(str(heatmap_path), cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
        return str(heatmap_path)
    except InferenceAppError:
        raise
    except Exception as exc:
        raise InferenceAppError(f'Grad-CAM generation failed: {exc}') from exc


def run_pipeline(task_id: str, file_path: str) -> dict[str, str | float | int | PredictionLabel | None]:
    started_at = perf_counter()
    classification = classify_image(file_path)
    prediction = classification['prediction']
    heatmap_path = generate_gradcam(file_path, classification['rgb'])
    duration_ms = int((perf_counter() - started_at) * 1000)
    performance_logger.info('prediction_done task_id=%s processing_ms=%s confidence=%.4f', task_id, duration_ms, classification['confidence'])
    return {
        'prediction': prediction,
        'confidence': float(classification['confidence']),
        'probability': float(classification['pneumonia_prob']),
        'prob_dn': float(classification['pneumonia_prob']),
        'lesion_pct': None,
        'bbox_x1': None,
        'bbox_y1': None,
        'bbox_x2': None,
        'bbox_y2': None,
        'dice_score': None,
        'heatmap_dn_path': heatmap_path,
        'heatmap_eff_path': None,
        'lung_mask_path': None,
    }
