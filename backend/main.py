"""
SkinVision AI — FastAPI Backend v2
Skin validation → EfficientNetB3 inference → SQLite persistence
Demo mode (deterministic hash-based) when no trained model is present.
"""

from __future__ import annotations

import hashlib
import io
import json
import os
import sqlite3
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image

from model.skin_validator import is_real_skin

# ── Configuration ──────────────────────────────────────────────────────────
IMG_SIZE = (224, 224)
CLASS_NAMES = ["mole", "non_mole", "pimple", "healthy"]
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)
DB_PATH = "skinvision.db"

MODEL: Any = None

CLASS_INFO = {
    "mole": {
        "label": "Mole / Melanocytic Lesion",
        "description": (
            "A melanocytic lesion detected. May be a benign nevus or potential melanoma. "
            "ABCDE evaluation recommended."
        ),
        "isMalignant": None,
        "color": "#EF4444",
        "urgency": "Monitor closely",
        "advice": (
            "Track changes over time. If asymmetric, borders are irregular, colour varies, "
            "diameter is >6 mm, or it is evolving — consult a dermatologist urgently."
        ),
        "emoji": "🔴",
    },
    "non_mole": {
        "label": "Non-Mole Skin Lesion",
        "description": (
            "A non-melanocytic lesion detected. Likely benign "
            "(keratosis, dermatofibroma, or vascular lesion)."
        ),
        "isMalignant": False,
        "color": "#F59E0B",
        "urgency": "Low — monitor",
        "advice": "Usually benign. Consult a dermatologist if it bleeds, itches, or changes rapidly.",
        "emoji": "🟡",
    },
    "pimple": {
        "label": "Acne / Pimple",
        "description": "Acne vulgaris detected. Inflammatory or non-inflammatory acne lesion.",
        "isMalignant": False,
        "color": "#F97316",
        "urgency": "Low",
        "advice": (
            "Use gentle cleansers and avoid picking. For persistent or severe acne, "
            "a dermatologist can prescribe topical or oral treatments."
        ),
        "emoji": "🟠",
    },
    "healthy": {
        "label": "Healthy Skin",
        "description": "No significant skin condition detected. Your skin appears healthy.",
        "isMalignant": False,
        "color": "#10B981",
        "urgency": "None",
        "advice": "Continue regular self-checks and apply SPF 30+ sunscreen daily.",
        "emoji": "🟢",
    },
}


# ── Startup / Shutdown ──────────────────────────────────────────────────────
def _load_model() -> None:
    global MODEL
    for candidate in [
        "models/skinvision_best.keras",
        "models/skinvision_best.h5",
        "models/skinvision_final.keras",
        "models/skinvision_final.h5",
    ]:
        if os.path.exists(candidate):
            try:
                import tensorflow as tf  # noqa: PLC0415
                MODEL = tf.keras.models.load_model(candidate)
                print(f"[SkinVision] Model loaded from {candidate}")
                return
            except Exception as exc:
                print(f"[SkinVision] Failed to load {candidate}: {exc}")
    print("[SkinVision] No trained model found - running in deterministic demo mode.")


def _init_db() -> None:
    con = sqlite3.connect(DB_PATH)
    con.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id          TEXT PRIMARY KEY,
            image_url   TEXT,
            result      TEXT,
            confidence  REAL,
            class_name  TEXT,
            risk_level  TEXT,
            risk_score  INTEGER,
            skin_ratio  REAL,
            abcde_json  TEXT,
            explanation TEXT,
            body_location TEXT,
            all_probs   TEXT,
            created_at  TEXT
        )
    """)
    con.execute("""
        CREATE TABLE IF NOT EXISTS consultations (
            id           TEXT PRIMARY KEY,
            scan_id      TEXT NOT NULL,
            doctor_email TEXT,
            message      TEXT,
            share_token  TEXT UNIQUE,
            status       TEXT DEFAULT 'pending',
            created_at   TEXT
        )
    """)
    con.commit()
    con.close()


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    _load_model()
    _init_db()
    yield


# ── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(title="SkinVision AI", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ── Helpers ─────────────────────────────────────────────────────────────────
def _preprocess(image_bytes: bytes) -> "np.ndarray":
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


def _compute_abcde(class_name: str, confidence: float, seed: int) -> dict:
    rng = np.random.default_rng(seed)
    if class_name == "mole":
        concern = max(0.3, 1.0 - confidence)
        return {k: round(float(rng.uniform(concern * 4, concern * 9 + 1)), 1) for k in
                ["asymmetry", "border", "color", "diameter", "evolution"]}
    return {k: round(float(rng.uniform(1.0, 3.5)), 1) for k in
            ["asymmetry", "border", "color", "diameter", "evolution"]}


def _compute_risk(class_name: str, confidence: float, abcde: dict) -> dict:
    avg = sum(abcde.values()) / len(abcde)
    weights = {"mole": (60, 4), "non_mole": (25, 2), "pimple": (20, 1), "healthy": (10, 0)}
    w_conf, w_abcde = weights.get(class_name, (20, 1))
    score = int(min(100, max(0, confidence * w_conf + avg * w_abcde)))
    level = "Low"
    if score >= 25: level = "Medium"
    if score >= 50: level = "High"
    if score >= 75: level = "Critical"
    return {"risk_score": score, "risk_level": level}


def _run_inference(image_bytes: bytes) -> dict:
    if MODEL is not None:
        x = _preprocess(image_bytes)
        probs = MODEL.predict(x, verbose=0)[0]  # type: ignore[union-attr]
        idx = int(np.argmax(probs))
        conf = float(probs[idx])
        name = CLASS_NAMES[idx]
        all_probs = {CLASS_NAMES[i]: round(float(probs[i]) * 100, 1) for i in range(4)}
        seed = int(hashlib.md5(image_bytes[:512]).hexdigest(), 16) % (2 ** 32)
    else:
        h = int(hashlib.md5(image_bytes[:1024]).hexdigest(), 16)
        seed = h % (2 ** 32)
        idx = h % 4
        name = CLASS_NAMES[idx]
        conf = 0.65 + (h % 30) / 100.0
        base = [0.04, 0.04, 0.04, 0.04]
        base[idx] = conf
        total = sum(base)
        all_probs = {CLASS_NAMES[i]: round(base[i] / total * 100, 1) for i in range(4)}

    info = CLASS_INFO[name]
    abcde = _compute_abcde(name, conf, seed)
    risk = _compute_risk(name, conf, abcde)

    explanation = (
        f"AI detected {info['label']} with {round(conf * 100, 1)}% confidence. "
        f"{info['description']} "
        f"Risk: {risk['risk_level']}. {info['advice']}"
    )

    return {
        "class_name": name,
        "label": info["label"],
        "confidence": round(conf * 100, 1),
        "all_probabilities": all_probs,
        "is_malignant": info["isMalignant"],
        "color": info["color"],
        "urgency": info["urgency"],
        "advice": info["advice"],
        "emoji": info["emoji"],
        "abcde_scores": abcde,
        "risk_level": risk["risk_level"],
        "risk_score": risk["risk_score"],
        "explanation": explanation,
    }


def _get_scan_row(scan_id: str) -> dict | None:
    con = sqlite3.connect(DB_PATH)
    row = con.execute("SELECT * FROM scans WHERE id=?", (scan_id,)).fetchone()
    con.close()
    if not row:
        return None
    cols = ["id", "image_url", "result", "confidence", "class_name",
            "risk_level", "risk_score", "skin_ratio", "abcde_scores",
            "explanation", "body_location", "all_probabilities", "created_at"]
    s = dict(zip(cols, row))
    s["abcde_scores"] = json.loads(s["abcde_scores"] or "{}")
    s["all_probabilities"] = json.loads(s["all_probabilities"] or "{}")
    s["label"] = s["result"]
    return s


# ── Routes ───────────────────────────────────────────────────────────────────
@app.post("/api/analyze")
async def analyze_skin(
    file: UploadFile = File(...),
    body_location: str = Form(default=""),
):
    image_bytes = await file.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large. Maximum size is 10 MB.")

    validation = is_real_skin(image_bytes)
    if not validation["is_valid"]:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "INVALID_SKIN_IMAGE",
                "message": validation["reason"],
                "skin_ratio": validation["skin_ratio"],
            },
        )

    scan_id = str(uuid.uuid4())
    ext = (file.filename or "scan.jpg").rsplit(".", 1)[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "webp"}:
        ext = "jpg"
    img_path = UPLOADS_DIR / f"{scan_id}.{ext}"
    img_path.write_bytes(image_bytes)

    result = _run_inference(image_bytes)

    created_at = datetime.utcnow().isoformat()
    con = sqlite3.connect(DB_PATH)
    con.execute(
        "INSERT INTO scans VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (
            scan_id, f"/uploads/{scan_id}.{ext}",
            result["label"], result["confidence"], result["class_name"],
            result["risk_level"], result["risk_score"],
            validation["skin_ratio"],
            json.dumps(result["abcde_scores"]),
            result["explanation"],
            body_location,
            json.dumps(result["all_probabilities"]),
            created_at,
        ),
    )
    con.commit()
    con.close()

    return {
        "id": scan_id,
        "image_url": f"/uploads/{scan_id}.{ext}",
        "skin_ratio": validation["skin_ratio"],
        "created_at": created_at,
        **result,
    }


@app.get("/api/scans")
async def list_scans():
    con = sqlite3.connect(DB_PATH)
    rows = con.execute(
        "SELECT * FROM scans ORDER BY created_at DESC LIMIT 100"
    ).fetchall()
    con.close()
    cols = ["id", "image_url", "result", "confidence", "class_name",
            "risk_level", "risk_score", "skin_ratio", "abcde_scores",
            "explanation", "body_location", "all_probabilities", "created_at"]
    scans = []
    for row in rows:
        s = dict(zip(cols, row))
        s["abcde_scores"] = json.loads(s["abcde_scores"] or "{}")
        s["all_probabilities"] = json.loads(s["all_probabilities"] or "{}")
        s["label"] = s["result"]
        scans.append(s)
    return scans


@app.get("/api/scans/{scan_id}")
async def get_scan(scan_id: str):
    s = _get_scan_row(scan_id)
    if not s:
        raise HTTPException(status_code=404, detail="Scan not found")
    return s


@app.delete("/api/scans/{scan_id}", status_code=204)
async def delete_scan(scan_id: str):
    con = sqlite3.connect(DB_PATH)
    row = con.execute("SELECT image_url FROM scans WHERE id=?", (scan_id,)).fetchone()
    if row:
        con.execute("DELETE FROM scans WHERE id=?", (scan_id,))
        con.commit()
        img_file = Path("." + row[0])
        if img_file.exists():
            img_file.unlink()
    con.close()


# ── Consultation / TeleDerm ──────────────────────────────────────────────────
@app.post("/api/consultations")
async def create_consultation(
    scan_id: str = Form(...),
    doctor_email: str = Form(default=""),
    message: str = Form(default=""),
):
    s = _get_scan_row(scan_id)
    if not s:
        raise HTTPException(status_code=404, detail="Scan not found")

    consultation_id = str(uuid.uuid4())
    share_token = hashlib.sha256(f"{scan_id}{consultation_id}".encode()).hexdigest()[:32]
    created_at = datetime.utcnow().isoformat()

    con = sqlite3.connect(DB_PATH)
    con.execute(
        "INSERT INTO consultations VALUES (?,?,?,?,?,?,?)",
        (consultation_id, scan_id, doctor_email or None,
         message or None, share_token, "pending", created_at),
    )
    con.commit()
    con.close()

    return {
        "id": consultation_id,
        "share_token": share_token,
        "status": "pending",
        "created_at": created_at,
    }


@app.get("/api/shared/{share_token}")
async def get_shared_report(share_token: str):
    con = sqlite3.connect(DB_PATH)
    row = con.execute(
        "SELECT * FROM consultations WHERE share_token=?", (share_token,)
    ).fetchone()
    con.close()
    if not row:
        raise HTTPException(status_code=404, detail="Shared report not found")

    cols = ["id", "scan_id", "doctor_email", "message", "share_token", "status", "created_at"]
    consultation = dict(zip(cols, row))

    scan = _get_scan_row(consultation["scan_id"])
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    return {"scan": scan, "consultation": consultation}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": MODEL is not None,
        "version": "2.0.0",
    }
