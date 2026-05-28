"""
Skin Authenticity Validator — v2
Rejects non-skin images: paper drawings, cartoons, random objects, food, animals.
Uses multi-color-space skin detection + texture & color diversity checks.
Tuned to be inclusive of all human skin tones (light through dark).
"""

import cv2
import numpy as np


def is_real_skin(image_bytes: bytes, min_skin_ratio: float = 0.12) -> dict:
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
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"is_valid": False, "skin_ratio": 0.0, "texture_score": 0.0,
                "reason": "Invalid image format or corrupted file."}

    img_r = cv2.resize(img, (256, 256))

    # ── HSV skin detection (covers pale → deep skin tones) ─────────────────
    hsv       = cv2.cvtColor(img_r, cv2.COLOR_BGR2HSV)
    mask_hsv  = cv2.inRange(hsv,
                            np.array([0,  15, 50], np.uint8),
                            np.array([25, 255, 255], np.uint8))
    mask_hsv2 = cv2.inRange(hsv,
                            np.array([160, 15, 50], np.uint8),
                            np.array([180, 255, 255], np.uint8))
    mask_hsv  = cv2.bitwise_or(mask_hsv, mask_hsv2)

    # ── YCrCb skin detection (robust across ethnicities) ───────────────────
    ycrcb    = cv2.cvtColor(img_r, cv2.COLOR_BGR2YCrCb)
    mask_ycc = cv2.inRange(ycrcb,
                           np.array([0,  133, 75], np.uint8),
                           np.array([255, 178, 128], np.uint8))

    # ── Combine & clean up ──────────────────────────────────────────────────
    combined = cv2.bitwise_or(mask_hsv, mask_ycc)
    kernel   = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    combined = cv2.morphologyEx(combined, cv2.MORPH_OPEN,   kernel)
    combined = cv2.morphologyEx(combined, cv2.MORPH_DILATE, kernel)

    total      = img_r.shape[0] * img_r.shape[1]
    skin_px    = int(cv2.countNonZero(combined))
    skin_ratio = skin_px / total

    # ── Texture check: low variance → drawing / flat image ─────────────────
    gray          = cv2.cvtColor(img_r, cv2.COLOR_BGR2GRAY)
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    has_texture   = laplacian_var > 50   # raised from 40 — stricter

    # ── Color diversity: cartoons / solid objects have few unique colors ────
    unique_colors = len(np.unique(img_r.reshape(-1, 3), axis=0))
    has_diversity = unique_colors > 500  # raised from 400 — stricter

    # ── Non-skin dominant-color check ───────────────────────────────────────
    # Reject images where the dominant color is clearly non-skin
    # (very blue, very green, pure white, pure black backgrounds)
    mean_bgr   = cv2.mean(img_r)[:3]          # B, G, R channel means
    b, g, r    = mean_bgr
    is_too_blue  = (b > 150) and (b > r + 40) and (b > g + 30)  # sky/water
    is_too_green = (g > 150) and (g > r + 40) and (g > b + 20)  # grass/leaves
    is_too_white = min(b, g, r) > 220 and max(b, g, r) - min(b, g, r) < 20
    is_too_dark  = max(b, g, r) < 30
    bad_dominant_color = is_too_blue or is_too_green or is_too_white or is_too_dark

    is_valid = (
        skin_ratio >= min_skin_ratio
        and has_texture
        and has_diversity
        and not bad_dominant_color
    )

    # ── Reason message ──────────────────────────────────────────────────────
    if not is_valid:
        if bad_dominant_color:
            if is_too_blue:
                reason = "Image appears to be sky, water, or non-skin object. Please upload a close-up skin photo."
            elif is_too_green:
                reason = "Image appears to be plant or outdoor scene. Please upload a close-up skin photo."
            elif is_too_white or is_too_dark:
                reason = "Image exposure is too extreme. Please upload a well-lit skin photo."
            else:
                reason = "Dominant color is not skin-like. Please upload a real skin photo."
        elif skin_ratio < min_skin_ratio:
            reason = (
                f"Insufficient skin area detected ({skin_ratio:.1%}). "
                "Please upload a clear, close-up photo of your skin."
            )
        elif not has_texture:
            reason = "Image appears to be a drawing or illustration. Please upload a real skin photo."
        else:
            reason = "Image has too few color variations. Please upload a real close-up skin photo."
    else:
        reason = "Valid skin image detected."

    return {
        "is_valid":      is_valid,
        "skin_ratio":    round(skin_ratio, 3),
        "texture_score": round(laplacian_var, 2),
        "reason":        reason,
    }
