"""
SkinVision AI — Training Script
================================
Train your own skin condition classifier using transfer learning.

STEP 1 — Create this folder structure and add your images:

  backend/
  └── data/
      └── train/
          ├── melanoma/        ← melanoma / suspicious mole images
          ├── non_melanoma/    ← non-melanoma: BCC, SCC, keratosis, normal moles
          ├── acne/            ← acne / pimple images  (optional)
          └── healthy/         ← healthy skin images   (optional)

  Supported formats: .jpg  .jpeg  .png
  Minimum: 30+ images per class  |  Best: 200+ per class

STEP 2 — Install TensorFlow (Python 3.9–3.12 only):
  python -m pip install tensorflow==2.16.1

STEP 3 — Run training:
  cd backend
  python model/train_model.py

STEP 4 — Model saved to:
  backend/models/skinvision_best.keras
  backend/models/skinvision_final.h5

STEP 5 — Restart backend:
  python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

# Fix Windows console UTF-8 for emoji/unicode output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        pass

# ── Auto-install missing deps ───────────────────────────────────────────────
def _ensure(package: str, import_name: str | None = None) -> None:
    """Install a package if it's not already importable."""
    mod = import_name or package
    try:
        __import__(mod)
    except ImportError:
        print(f"[setup] Installing {package}...")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-q", package]
        )

_ensure("scipy")
_ensure("scikit-learn", "sklearn")

# ── Config ─────────────────────────────────────────────────────────────────
DATA_DIR          = Path("data/train")
MODELS_DIR        = Path("models")
IMG_SIZE          = (224, 224)
BATCH_SIZE        = 16          # reduce to 8 if you get OOM errors
EPOCHS_FROZEN     = 15          # Phase 1: train head only
EPOCHS_FINETUNE   = 25          # Phase 2: fine-tune top layers
MIN_IMGS_PER_CLS  = 20          # fewer → skip that class
VALIDATION_SPLIT  = 0.2


# ── Dataset check ──────────────────────────────────────────────────────────
def check_dataset() -> list[str]:
    """Scan data/train/ and return list of usable class names."""
    if not DATA_DIR.exists():
        _print_dataset_help()
        sys.exit(1)

    classes: list[str] = []
    skipped: list[str] = []
    IMG_EXTS = ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG")

    print("\n📂 Dataset Scan")
    print("=" * 50)
    for cls_dir in sorted(DATA_DIR.iterdir()):
        if not cls_dir.is_dir():
            continue
        images = []
        for ext in IMG_EXTS:
            images.extend(cls_dir.glob(ext))
        count = len(images)
        if count >= MIN_IMGS_PER_CLS:
            classes.append(cls_dir.name)
            tip = ""
            if count < 50:
                tip = " ⚠️  (more images = better accuracy)"
            print(f"  ✅  {cls_dir.name:<20s}: {count:5d} images{tip}")
        else:
            skipped.append(cls_dir.name)
            print(f"  ❌  {cls_dir.name:<20s}: {count:5d} images  (need {MIN_IMGS_PER_CLS}+, skipped)")

    print("=" * 50)

    if len(classes) < 2:
        print(f"\n❌ Need at least 2 classes with {MIN_IMGS_PER_CLS}+ images each.")
        _print_dataset_help()
        sys.exit(1)

    print(f"\n✅ Training {len(classes)} classes: {classes}")
    return classes


def _print_dataset_help():
    print("""
How to set up your dataset:
----------------------------
1. Create these folders inside  backend/data/train/

   backend/data/train/melanoma/        ← put melanoma images here
   backend/data/train/non_melanoma/    ← non-melanoma images here
   backend/data/train/acne/            ← acne images (optional)
   backend/data/train/healthy/         ← healthy skin (optional)

2. Each folder needs at least 20 images (.jpg / .png)
   More images = more accurate detection.
   Recommended: 100–500 images per class.

3. Free datasets you can use:
   • ISIC 2019 Challenge  →  https://challenge.isic-archive.com/data/
   • DermNet NZ           →  https://dermnet.com/
   • HAM10000             →  https://kaggle.com/datasets/kmader/skin-lesion-analysis-toward-melanoma-detection
""")


# ── Model builder ──────────────────────────────────────────────────────────
def build_model(num_classes: int, use_efficientnet: bool = True):
    """
    Returns (model, base_model).
    Uses EfficientNetB0 by default (fast + accurate).
    Set use_efficientnet=False to use MobileNetV2 (even faster, slightly less accurate).
    """
    import tensorflow as tf
    from tensorflow.keras import layers, Model

    if use_efficientnet:
        from tensorflow.keras.applications import EfficientNetB0
        base = EfficientNetB0(
            include_top=False,
            weights="imagenet",
            input_shape=(*IMG_SIZE, 3),
        )
        print("🏗  Using EfficientNetB0 backbone")
    else:
        from tensorflow.keras.applications import MobileNetV2
        base = MobileNetV2(
            include_top=False,
            weights="imagenet",
            input_shape=(*IMG_SIZE, 3),
        )
        print("🏗  Using MobileNetV2 backbone")

    base.trainable = False   # Freeze for Phase 1

    x = base.output
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.45)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)

    if num_classes == 2:
        # Binary classifier — single sigmoid output
        output = layers.Dense(1, activation="sigmoid")(x)
        loss   = "binary_crossentropy"
        print("📐 Binary classifier (2 classes)")
    else:
        # Multi-class softmax
        output = layers.Dense(num_classes, activation="softmax")(x)
        loss   = "categorical_crossentropy"
        print(f"📐 Multi-class classifier ({num_classes} classes)")

    model = Model(inputs=base.input, outputs=output)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss=loss,
        metrics=["accuracy"],
    )
    return model, base


# ── Training ────────────────────────────────────────────────────────────────
def train():
    # 1. Check TF installed
    try:
        import tensorflow as tf
        print(f"✅ TensorFlow {tf.__version__}")
    except ImportError:
        print("❌ TensorFlow not installed!")
        print("   Install: python -m pip install tensorflow==2.16.1")
        print("   Requires Python 3.9–3.12")
        sys.exit(1)

    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    from tensorflow.keras.callbacks import (
        EarlyStopping, ModelCheckpoint, ReduceLROnPlateau,
    )

    # 2. Check dataset
    classes     = check_dataset()
    num_classes = len(classes)
    class_mode  = "binary" if num_classes == 2 else "categorical"
    MODELS_DIR.mkdir(exist_ok=True)

    # 3. Data generators
    aug = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=40,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.15,
        zoom_range=0.3,
        horizontal_flip=True,
        vertical_flip=True,
        brightness_range=[0.7, 1.3],
        fill_mode="nearest",
        validation_split=VALIDATION_SPLIT,
    )

    train_gen = aug.flow_from_directory(
        DATA_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode=class_mode,
        classes=classes,
        subset="training",
        shuffle=True,
    )
    val_gen = aug.flow_from_directory(
        DATA_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode=class_mode,
        classes=classes,
        subset="validation",
        shuffle=False,
    )

    print(f"\n🖼  Training images  : {train_gen.samples}")
    print(f"🖼  Validation images: {val_gen.samples}")
    print(f"📌 Class indices    : {train_gen.class_indices}")

    # 4. Build model
    model, base = build_model(num_classes)
    best_path   = str(MODELS_DIR / "skinvision_best.keras")

    # 5. Callbacks
    def make_callbacks(phase: str):
        return [
            EarlyStopping(
                monitor="val_accuracy",
                patience=6,
                restore_best_weights=True,
                verbose=1,
            ),
            ReduceLROnPlateau(
                monitor="val_loss",
                factor=0.5,
                patience=3,
                min_lr=1e-8,
                verbose=1,
            ),
            ModelCheckpoint(
                best_path,
                monitor="val_accuracy",
                save_best_only=True,
                verbose=1,
            ),
        ]

    # ── Phase 1: Train head only (base frozen) ──────────────────────────────
    print(f"\n{'='*55}")
    print("🚀 Phase 1: Training classification head (base frozen)")
    print(f"   Epochs: {EPOCHS_FROZEN}")
    print(f"{'='*55}")

    h1 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=EPOCHS_FROZEN,
        callbacks=make_callbacks("phase1"),
        verbose=1,
    )

    best_acc_p1 = max(h1.history.get("val_accuracy", [0]))
    print(f"\n✅ Phase 1 done  |  Best val accuracy: {best_acc_p1:.1%}")

    # ── Phase 2: Fine-tune top 40 layers ────────────────────────────────────
    print(f"\n{'='*55}")
    print("🔓 Phase 2: Fine-tuning top 40 layers")
    print(f"   Epochs: {EPOCHS_FROZEN} → {EPOCHS_FROZEN + EPOCHS_FINETUNE}")
    print(f"{'='*55}")

    for layer in base.layers[-40:]:
        layer.trainable = True

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=5e-5),
        loss=model.loss,
        metrics=["accuracy"],
    )

    h2 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=EPOCHS_FROZEN + EPOCHS_FINETUNE,
        initial_epoch=len(h1.history["loss"]),
        callbacks=make_callbacks("phase2"),
        verbose=1,
    )

    best_acc_p2 = max(h2.history.get("val_accuracy", [0]))
    overall_best = max(best_acc_p1, best_acc_p2)

    # ── Save final model ─────────────────────────────────────────────────────
    model.save(str(MODELS_DIR / "skinvision_final.keras"))
    model.save(str(MODELS_DIR / "skinvision_final.h5"))

    # Save class list so main.py knows how to map predictions
    with open(MODELS_DIR / "classes.json", "w") as f:
        json.dump(classes, f)

    print(f"""
{'='*55}
✅  Training Complete!
{'='*55}
   Classes trained : {classes}
   Best accuracy   : {overall_best:.1%}
   Model saved     : {MODELS_DIR}/skinvision_best.keras
                     {MODELS_DIR}/skinvision_final.h5
   Classes file    : {MODELS_DIR}/classes.json

🚀  Start the backend now:
   cd backend
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
{'='*55}
""")


# ── Quick dataset stats ─────────────────────────────────────────────────────
def show_stats():
    """Just show dataset stats without training."""
    check_dataset()


if __name__ == "__main__":
    if "--stats" in sys.argv:
        show_stats()
    else:
        train()
