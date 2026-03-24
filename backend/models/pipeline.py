from __future__ import annotations

from pathlib import Path
from typing import Any

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

from backend.database.models import DiseaseType, EnsembleStatus, PredictionLabel
from backend.models.loader import model_registry


IMAGE_SIZE = 224
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]
IMAGENET_TRANSFORM = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD),
])
MASK_TRANSFORM = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
])


class GradCAM:
    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.gradients: torch.Tensor | None = None
        self.activations: torch.Tensor | None = None
        self._hooks: list[Any] = []
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
        self.model.eval()
        output = self.model(input_tensor)
        self.model.zero_grad(set_to_none=True)
        output.backward(torch.ones_like(output))
        if self.gradients is None or self.activations is None:
            raise RuntimeError('GradCAM hooks did not capture gradients/activations')
        weights = self.gradients.mean(dim=[2, 3], keepdim=True)
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = F.relu(cam)
        cam = F.interpolate(cam, size=input_tensor.shape[2:], mode='bilinear', align_corners=False)
        cam = cam.squeeze().detach().cpu().numpy()
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 1e-8:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)
        return cam.astype(np.float32)


class GradCAMPlusPlus(GradCAM):
    def __call__(self, input_tensor: torch.Tensor) -> np.ndarray:
        self.model.eval()
        output = self.model(input_tensor)
        self.model.zero_grad(set_to_none=True)
        output.backward(torch.ones_like(output))
        if self.gradients is None or self.activations is None:
            raise RuntimeError('GradCAM++ hooks did not capture gradients/activations')
        grads = self.gradients
        acts = self.activations
        grads_sq = grads ** 2
        grads_cub = grads ** 3
        sum_acts = acts.sum(dim=[2, 3], keepdim=True)
        denom = 2 * grads_sq + sum_acts * grads_cub + 1e-8
        alpha = grads_sq / denom
        weights = (alpha * F.relu(grads)).mean(dim=[2, 3], keepdim=True)
        cam = (weights * acts).sum(dim=1, keepdim=True)
        cam = F.relu(cam)
        cam = F.interpolate(cam, size=input_tensor.shape[2:], mode='bilinear', align_corners=False)
        cam = cam.squeeze().detach().cpu().numpy()
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 1e-8:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)
        return cam.astype(np.float32)


def _load_rgb(path: str) -> np.ndarray:
    image = cv2.imread(path, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError(f'Cannot read image: {path}')
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def _tensor_from_rgb(image: np.ndarray) -> torch.Tensor:
    pil = Image.fromarray(image)
    return IMAGENET_TRANSFORM(pil).unsqueeze(0).to(model_registry.device)


def _tensor_for_mask(image: np.ndarray) -> torch.Tensor:
    pil = Image.fromarray(image)
    return MASK_TRANSFORM(pil).unsqueeze(0).to(model_registry.device)


def _save_rgb(path: Path, image: np.ndarray) -> None:
    cv2.imwrite(str(path), cv2.cvtColor(image, cv2.COLOR_RGB2BGR))


def _overlay_heatmap(rgb: np.ndarray, heatmap: np.ndarray, alpha: float = 0.4) -> np.ndarray:
    if heatmap.shape != rgb.shape[:2]:
        heatmap = cv2.resize(heatmap, (rgb.shape[1], rgb.shape[0]))
    heat_u8 = np.uint8(255 * np.clip(heatmap, 0, 1))
    colored = cv2.applyColorMap(heat_u8, cv2.COLORMAP_JET)
    colored = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    base = rgb.astype(np.float32) / 255.0
    blended = alpha * colored + (1 - alpha) * base
    return np.uint8(255 * np.clip(blended, 0, 1))


def _extract_lung_mask(unet: torch.nn.Module, image_rgb: np.ndarray, task_dir: Path) -> tuple[np.ndarray, tuple[int, int, int, int], float, str, str]:
    input_tensor = _tensor_for_mask(image_rgb)
    with torch.inference_mode():
        logits = unet(input_tensor)
        probs = torch.sigmoid(logits)[0, 0].cpu().numpy()
    mask_small = (probs > 0.5).astype(np.uint8)
    mask = cv2.resize(mask_small, (image_rgb.shape[1], image_rgb.shape[0]), interpolation=cv2.INTER_NEAREST)
    if mask.sum() == 0:
        mask[:] = 1
    mask_path = task_dir / 'lung_mask.jpg'
    cv2.imwrite(str(mask_path), mask * 255)
    ys, xs = np.where(mask > 0)
    x1, x2 = int(xs.min()), int(xs.max())
    y1, y2 = int(ys.min()), int(ys.max())
    cropped = image_rgb[y1:y2 + 1, x1:x2 + 1]
    cropped_path = task_dir / 'cropped.jpg'
    _save_rgb(cropped_path, cropped)
    dice_score = float(probs.mean())
    return mask, (x1, y1, x2, y2), dice_score, str(mask_path), str(cropped_path)


def _predict_binary(model: torch.nn.Module, image_rgb: np.ndarray) -> tuple[float, torch.Tensor]:
    input_tensor = _tensor_from_rgb(image_rgb)
    with torch.inference_mode():
        logits = model(input_tensor)
        prob = torch.sigmoid(logits).squeeze().item()
    return float(prob), input_tensor


def _predict_multiclass(model: torch.nn.Module, image_rgb: np.ndarray) -> tuple[np.ndarray, torch.Tensor]:
    input_tensor = _tensor_from_rgb(image_rgb)
    with torch.inference_mode():
        logits = model(input_tensor)
        probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()
    return probs.astype(np.float32), input_tensor


def _generate_cam(model: torch.nn.Module, input_tensor: torch.Tensor, target_layer: torch.nn.Module, use_plusplus: bool = False) -> np.ndarray:
    cam_cls = GradCAMPlusPlus if use_plusplus else GradCAM
    cam_obj = cam_cls(model, target_layer)
    tensor = input_tensor.clone().detach().requires_grad_(True)
    try:
        return cam_obj(tensor)
    finally:
        cam_obj.remove_hooks()


def _build_bbox(heat_dn: np.ndarray, heat_eff: np.ndarray, lung_mask: np.ndarray) -> tuple[tuple[int, int, int, int], float]:
    combined = np.maximum(heat_dn, heat_eff)
    activation = (combined > 0.45).astype(np.uint8)
    lesion = activation * (lung_mask > 0).astype(np.uint8)
    if lesion.sum() == 0:
        lesion = (lung_mask > 0).astype(np.uint8)
    ys, xs = np.where(lesion > 0)
    x1, x2 = int(xs.min()), int(xs.max())
    y1, y2 = int(ys.min()), int(ys.max())
    lesion_pct = float(100.0 * lesion.sum() / max(1, int((lung_mask > 0).sum())))
    return (x1, y1, x2, y2), lesion_pct


def run_pipeline(task_id: str, file_path: str) -> dict[str, Any]:
    task_dir = Path(file_path).parent
    image_rgb = _load_rgb(file_path)

    unet = model_registry.get('unet')
    densenet_t1 = model_registry.get('densenet_t1')
    effnet_t1 = model_registry.get('effnet_t1')
    densenet_t2 = model_registry.get('densenet_t2')

    lung_mask, crop_bbox, dice_score, lung_mask_path, cropped_path = _extract_lung_mask(unet, image_rgb, task_dir)
    x1, y1, x2, y2 = crop_bbox
    cropped_rgb = image_rgb[y1:y2 + 1, x1:x2 + 1]

    prob_dn, dn_input = _predict_binary(densenet_t1, image_rgb)
    prob_eff, eff_input = _predict_binary(effnet_t1, cropped_rgb)

    avg_prob = (prob_dn + prob_eff) / 2.0
    prediction = PredictionLabel.pneumonia if avg_prob >= 0.5 else PredictionLabel.normal
    ensemble_status = None
    if prediction == PredictionLabel.pneumonia:
        ensemble_status = EnsembleStatus.confirmed if prob_dn >= 0.5 and prob_eff >= 0.5 else EnsembleStatus.suspected

    dn_heat = _generate_cam(densenet_t1, dn_input, densenet_t1.features.denseblock4, use_plusplus=False)
    dn_heat = cv2.resize(dn_heat, (image_rgb.shape[1], image_rgb.shape[0]))
    dn_overlay = _overlay_heatmap(image_rgb, dn_heat)
    heatmap_dn_path = task_dir / 'heatmap_dn.jpg'
    _save_rgb(heatmap_dn_path, dn_overlay)

    eff_heat_crop = _generate_cam(effnet_t1, eff_input, effnet_t1.features[-1], use_plusplus=True)
    eff_canvas = np.zeros(image_rgb.shape[:2], dtype=np.float32)
    eff_canvas[y1:y2 + 1, x1:x2 + 1] = cv2.resize(eff_heat_crop, (x2 - x1 + 1, y2 - y1 + 1))
    eff_overlay = _overlay_heatmap(image_rgb, eff_canvas)
    heatmap_eff_path = task_dir / 'heatmap_eff.jpg'
    _save_rgb(heatmap_eff_path, eff_overlay)

    bbox, lesion_pct = _build_bbox(dn_heat, eff_canvas, lung_mask)
    bx1, by1, bx2, by2 = bbox
    bbox_overlay = image_rgb.copy()
    cv2.rectangle(bbox_overlay, (bx1, by1), (bx2, by2), (255, 0, 0), 2)
    bbox_overlay_path = task_dir / 'bbox_overlay.jpg'
    _save_rgb(bbox_overlay_path, bbox_overlay)

    disease_type = DiseaseType.none
    bacterial_prob = viral_prob = covid_prob = 0.0
    if prediction == PredictionLabel.pneumonia and ensemble_status == EnsembleStatus.confirmed:
        stage2_probs, _ = _predict_multiclass(densenet_t2, cropped_rgb)
        bacterial_prob, viral_prob, covid_prob = [float(x) for x in stage2_probs.tolist()]
        idx = int(np.argmax(stage2_probs))
        disease_type = [DiseaseType.bacterial, DiseaseType.viral, DiseaseType.covid][idx]

    return {
        'prediction': prediction,
        'ensemble_status': ensemble_status,
        'confidence': float(avg_prob),
        'prob_dn': float(prob_dn),
        'prob_eff': float(prob_eff),
        'disease_type': disease_type,
        'bacterial_prob': float(bacterial_prob),
        'viral_prob': float(viral_prob),
        'covid_prob': float(covid_prob),
        'lesion_pct': float(lesion_pct),
        'bbox_x1': int(bx1),
        'bbox_y1': int(by1),
        'bbox_x2': int(bx2),
        'bbox_y2': int(by2),
        'dice_score': float(dice_score),
        'heatmap_dn_path': str(heatmap_dn_path),
        'heatmap_eff_path': str(heatmap_eff_path),
        'lung_mask_path': str(lung_mask_path),
        'file_path': file_path,
    }
