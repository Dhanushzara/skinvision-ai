"""
Skin Authenticity Validator
Rejects non-skin images: paper drawings, cartoons, random objects.
Uses multi-color-space skin detection + texture & color diversity checks.
Tuned to be inclusive of all human skin tones (light through dark).
"""

import cv2
import numpy as np


def is_real_skin(image_bytes: bytes, min_skin_ratio: float = 0.10) -> dict:
    """
    Validates that the image contains real human skin.

    Returns:
        {
            "is_valid": bool,
            "skin_ratio": float,
            "texture_score": float,
            "reason": str
        }
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"is_valid": False, "skin_ratio": 0.0, "texture_score": 0.0,
                "reason": "Invalid image format or corrupted file."}

    img_r = cv2.resize(img, (256, 256))

    # ── HSV skin detection (covers pale → deep skin tones) ──
    hsv = cv2.cvtColor(img_r, cv2.COLOR_BGR2HSV)
    mask_hsv = cv2.inRange(hsv, np.array([0, 15, 50], np.uint8), np.array([25, 255, 255], np.uint8))
    mask_hsv2 = cv2.inRange(hsv, np.array([160, 15, 50], np.uint8), np.array([180, 255, 255], np.uint8))
    mask_hsv = cv2.bitwise_or(mask_hsv, mask_hsv2)

    # ── YCrCb skin detection (robust across ethnicities) ──
    ycrcb = cv2.cvtColor(img_r, cv2.COLOR_BGR2YCrCb)
    mask_ycc = cv2.inRange(
        ycrcb,
        np.array([0, 130, 75], np.uint8),
        np.array([255, 180, 135], np.uint8),
    )

    # ── Combine & clean up with morphological ops ──
    combined = cv2.bitwise_or(mask_hsv, mask_ycc)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    combined = cv2.morphologyEx(combined, cv2.MORPH_OPEN, kernel)
    combined = cv2.morphologyEx(combined, cv2.MORPH_DILATE, kernel)

    total = img_r.shape[0] * img_r.shape[1]
    skin_px = int(cv2.countNonZero(combined))
    skin_ratio = skin_px / total

    # ── Texture check: low variance → drawing / flat image ──
    gray = cv2.cvtColor(img_r, cv2.COLOR_BGR2GRAY)
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    has_texture = laplacian_var > 40  # dermoscopy images can be smoother than natural photos

    # ── Color diversity: cartoons have very few unique colors ──
    unique_colors = len(np.unique(img_r.reshape(-1, 3), axis=0))
    has_diversity = unique_colors > 400

    is_valid = skin_ratio >= min_skin_ratio and has_texture and has_diversity

    if not is_valid:
        if skin_ratio < min_skin_ratio:
            reason = (
                f"Insufficient skin area detected ({skin_ratio:.1%}). "
                "Please upload a clear, close-up photo of your skin."
            )
        elif not has_texture:
            reason = "Image appears to be a drawing or illustration. Please upload a real photo."
        else:
            reason = "Image has too few color variations. Please upload a real skin photo."
    else:
        reason = "Valid skin image detected."

    return {
        "is_valid": is_valid,
        "skin_ratio": round(skin_ratio, 3),
        "texture_score": round(laplacian_var, 2),
        "reason": reason,
    }
