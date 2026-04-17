from __future__ import annotations

from pathlib import Path
from time import perf_counter

import cv2
import numpy as np
import torch
import torch.nn.functional as F

from backend.database.models import DiseaseType, PredictionLabel
from backend.models.loader import model_registry
from backend.utils.errors import InferenceAppError
from backend.utils.logging import performance_logger


IMAGE_SIZE = 224
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
TYPE_CLASSES = (DiseaseType.bacterial, DiseaseType.viral, DiseaseType.covid)


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

    def __call__(self, input_tensor: torch.Tensor, *, target_head: str = 'binary', class_idx: int | None = None) -> np.ndarray:
        output = self.model(input_tensor)
        if isinstance(output, tuple):
            logit_bin, logit_type = output
        else:
            logit_bin, logit_type = output, None
        self.model.zero_grad(set_to_none=True)
        if target_head == 'type' and logit_type is not None:
            resolved_idx = class_idx if class_idx is not None else int(torch.argmax(logit_type, dim=1).item())
            score = logit_type[:, resolved_idx].sum()
        else:
            score = logit_bin.sum()
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


def _preprocess_onnx(rgb: np.ndarray) -> np.ndarray:
    resized = cv2.resize(rgb, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
    data = resized.astype(np.float32) / 255.0
    data = (data - MEAN) / STD
    chw = np.transpose(data, (2, 0, 1))
    return np.expand_dims(chw, axis=0).astype(np.float32)


def _tensor_for_gradcam(rgb: np.ndarray) -> torch.Tensor:
    data = _preprocess_onnx(rgb)[0]
    tensor = torch.from_numpy(data).unsqueeze(0)
    return tensor.to(model_registry.device)


def _sigmoid(x: float) -> float:
    return float(1.0 / (1.0 + np.exp(-x)))


def _softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - np.max(logits)
    exp = np.exp(shifted)
    return exp / np.sum(exp)


def _extract_onnx_heads(raw_outputs: list[np.ndarray], output_names: list[str]) -> tuple[float, np.ndarray | None]:
    mapped = {name: np.array(value) for name, value in zip(output_names, raw_outputs)}
    binary: np.ndarray | None = mapped.get('logit_binary')
    type_logits: np.ndarray | None = mapped.get('logit_type')

    if binary is None:
        for value in mapped.values():
            flat = np.array(value).reshape(-1)
            if flat.size == 1:
                binary = flat
                break

    if type_logits is None:
        for value in mapped.values():
            flat = np.array(value).reshape(-1)
            if flat.size == 3:
                type_logits = flat
                break

    if binary is None:
        raise InferenceAppError('ONNX output does not contain binary head logits')

    binary_logit = float(np.array(binary).reshape(-1)[0])
    if type_logits is not None:
        type_logits = np.array(type_logits).reshape(-1)
    return binary_logit, type_logits


def _overlay_heatmap(rgb: np.ndarray, heatmap: np.ndarray, alpha: float = 0.4) -> np.ndarray:
    heatmap = cv2.resize(heatmap, (rgb.shape[1], rgb.shape[0]))
    heat_u8 = np.uint8(255 * np.clip(heatmap, 0, 1))
    colored = cv2.applyColorMap(heat_u8, cv2.COLORMAP_JET)
    colored = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    base = rgb.astype(np.float32) / 255.0
    blended = alpha * colored + (1 - alpha) * base
    return np.uint8(255 * np.clip(blended, 0, 1))


def ensure_models_ready(*, require_gradcam: bool = True) -> None:
    if model_registry.onnx_session is None:
        raise InferenceAppError('ONNX session is not loaded')
    if require_gradcam and model_registry.torch_model is None:
        raise InferenceAppError('Grad-CAM model is not loaded')


def classify_image(file_path: str) -> dict[str, float | PredictionLabel | DiseaseType | dict[str, float] | np.ndarray | None]:
    ensure_models_ready(require_gradcam=False)
    try:
        rgb = _load_rgb(file_path)
        onnx_input = _preprocess_onnx(rgb)
        assert model_registry.onnx_session is not None
        input_name = model_registry.onnx_session.get_inputs()[0].name
        output_names = [item.name for item in model_registry.onnx_session.get_outputs()]
        output = model_registry.onnx_session.run(None, {input_name: onnx_input})
        binary_logit, type_logits = _extract_onnx_heads(output, output_names)
        pneumonia_prob = _sigmoid(binary_logit)
        prediction = PredictionLabel.pneumonia if pneumonia_prob >= 0.5 else PredictionLabel.normal
        confidence = pneumonia_prob if prediction == PredictionLabel.pneumonia else (1.0 - pneumonia_prob)
        disease_type: DiseaseType | None = DiseaseType.none if prediction == PredictionLabel.normal else None
        type_probs: dict[str, float] | None = None

        if prediction == PredictionLabel.pneumonia and type_logits is not None:
            probs = _softmax(type_logits)
            type_probs = {
                'BACTERIAL': float(probs[0]),
                'VIRAL': float(probs[1]),
                'COVID': float(probs[2]),
            }
            disease_type = TYPE_CLASSES[int(np.argmax(probs))]

        return {
            'rgb': rgb,
            'prediction': prediction,
            'confidence': float(confidence),
            'pneumonia_prob': float(pneumonia_prob),
            'disease_type': disease_type,
            'type_probs': type_probs,
        }
    except InferenceAppError:
        raise
    except Exception as exc:
        raise InferenceAppError(f'Inference classification failed: {exc}') from exc


def generate_gradcam(file_path: str, rgb: np.ndarray, *, prediction: PredictionLabel, disease_type: DiseaseType | None) -> str | None:
    if model_registry.torch_model is None:
        return None
    ensure_models_ready(require_gradcam=True)
    try:
        task_dir = Path(file_path).parent
        cam_input = _tensor_for_gradcam(rgb).requires_grad_(True)
        assert model_registry.torch_model is not None
        gradcam = GradCAM(model_registry.torch_model, model_registry.torch_model.features.denseblock4)
        try:
            if prediction == PredictionLabel.pneumonia and disease_type in TYPE_CLASSES:
                heatmap = gradcam(cam_input, target_head='type', class_idx=TYPE_CLASSES.index(disease_type))
            else:
                heatmap = gradcam(cam_input, target_head='binary')
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
    disease_type = classification.get('disease_type')
    type_probs = classification.get('type_probs')
    heatmap_path = generate_gradcam(
        file_path,
        classification['rgb'],
        prediction=prediction,
        disease_type=disease_type if isinstance(disease_type, DiseaseType) else None,
    )
    duration_ms = int((perf_counter() - started_at) * 1000)
    performance_logger.info('prediction_done task_id=%s processing_ms=%s confidence=%.4f', task_id, duration_ms, classification['confidence'])
    return {
        'prediction': prediction,
        'confidence': float(classification['confidence']),
        # Keep prob_dn as pneumonia probability for backward compatibility.
        'prob_dn': float(classification['pneumonia_prob']),
        'prob_eff': None,
        'disease_type': disease_type.value if isinstance(disease_type, DiseaseType) else None,
        'bacterial_prob': float(type_probs['BACTERIAL']) if isinstance(type_probs, dict) and 'BACTERIAL' in type_probs else None,
        'viral_prob': float(type_probs['VIRAL']) if isinstance(type_probs, dict) and 'VIRAL' in type_probs else None,
        'covid_prob': float(type_probs['COVID']) if isinstance(type_probs, dict) and 'COVID' in type_probs else None,
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
