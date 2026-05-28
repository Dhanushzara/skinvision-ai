"""
SkinVision AI — Grad-CAM (Gradient-weighted Class Activation Mapping)
=======================================================================
Explainable AI: generates a heatmap overlay showing WHICH region of the
skin image the model focused on to make its prediction.

Red/yellow areas = high importance  |  Blue areas = low importance

Used for:
  - Showing patients exactly which lesion area was detected
  - Building trust in AI predictions
  - Research / clinical validation

Reference: Selvaraju et al. (2017) "Grad-CAM: Visual Explanations from
           Deep Networks via Gradient-based Localization"
           https://arxiv.org/abs/1610.02391
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Any

import cv2
import numpy as np


def _find_last_conv_layer(model: Any) -> str | None:
    """Find the last Conv2D layer name in the model (used for Grad-CAM)."""
    import tensorflow as tf
    for layer in reversed(model.layers):
        if isinstance(layer, (tf.keras.layers.Conv2D,
                              tf.keras.layers.DepthwiseConv2D)):
            return layer.name
    return None


def generate_gradcam(
    model: Any,
    image_bytes: bytes,
    class_idx: int,
    img_size: tuple = (224, 224),
    alpha: float = 0.45,
) -> bytes | None:
    """
    Generate a Grad-CAM heatmap overlaid on the original image.

    Args:
        model:       Loaded Keras model
        image_bytes: Raw image bytes (jpg/png)
        class_idx:   Index of the predicted class
        img_size:    Model input size (default 224x224)
        alpha:       Heatmap overlay strength (0 = invisible, 1 = full)

    Returns:
        JPEG bytes of the heatmap-overlaid image, or None on failure.
    """
    try:
        import tensorflow as tf
        from PIL import Image

        # ── Preprocess ────────────────────────────────────────────────────
        img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_resized = img_pil.resize(img_size, Image.LANCZOS)
        img_arr  = np.array(img_resized, dtype=np.float32) / 255.0
        img_batch = np.expand_dims(img_arr, axis=0)

        # ── Find last conv layer ──────────────────────────────────────────
        conv_layer_name = _find_last_conv_layer(model)
        if conv_layer_name is None:
            return None

        # ── Gradient model ────────────────────────────────────────────────
        grad_model = tf.keras.Model(
            inputs=model.inputs,
            outputs=[
                model.get_layer(conv_layer_name).output,
                model.output,
            ],
        )

        with tf.GradientTape() as tape:
            conv_outputs, predictions = grad_model(
                tf.cast(img_batch, tf.float32)
            )
            # Handle binary (sigmoid) vs multi-class (softmax)
            if predictions.shape[-1] == 1:
                loss = predictions[0][0]
            else:
                loss = predictions[0][class_idx]

        # ── Compute gradients ─────────────────────────────────────────────
        grads       = tape.gradient(loss, conv_outputs)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        conv_out = conv_outputs[0]
        heatmap  = conv_out @ pooled_grads[..., tf.newaxis]
        heatmap  = tf.squeeze(heatmap)
        heatmap  = tf.maximum(heatmap, 0)

        max_val = tf.reduce_max(heatmap)
        if max_val > 1e-8:
            heatmap = heatmap / max_val
        heatmap = heatmap.numpy()

        # ── Resize heatmap → image size ───────────────────────────────────
        heatmap_resized = cv2.resize(heatmap, img_size)
        heatmap_uint8   = np.uint8(255 * heatmap_resized)

        # Apply JET colormap (blue=low, green=medium, red/yellow=high concern)
        heatmap_color   = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        # ── Superimpose on original image ─────────────────────────────────
        orig_bgr       = cv2.cvtColor(np.array(img_resized), cv2.COLOR_RGB2BGR)
        superimposed   = cv2.addWeighted(orig_bgr, 1.0 - alpha,
                                         heatmap_color, alpha, 0)

        # ── Add legend bar at bottom ──────────────────────────────────────
        legend_h = 20
        legend   = np.zeros((legend_h, img_size[0], 3), dtype=np.uint8)
        for x in range(img_size[0]):
            val   = int(255 * x / img_size[0])
            color = cv2.applyColorMap(np.array([[val]], dtype=np.uint8),
                                      cv2.COLORMAP_JET)[0][0]
            legend[:, x] = color

        result = np.vstack([superimposed, legend])

        # ── Encode to JPEG ────────────────────────────────────────────────
        ok, buf = cv2.imencode(
            ".jpg", result, [cv2.IMWRITE_JPEG_QUALITY, 90]
        )
        return buf.tobytes() if ok else None

    except Exception as exc:
        print(f"[GradCAM] Error: {exc}")
        return None


def generate_gradcam_from_file(
    model: Any,
    image_path: str | Path,
    class_idx: int,
    **kwargs,
) -> bytes | None:
    """Convenience wrapper that reads from a file path."""
    path = Path(image_path)
    if not path.exists():
        return None
    return generate_gradcam(model, path.read_bytes(), class_idx, **kwargs)
