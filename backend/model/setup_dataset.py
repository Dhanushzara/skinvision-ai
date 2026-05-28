"""
SkinVision AI — Dataset Setup Helper
=====================================
Run this to see what images you have and what you need to add.

Usage:
  cd backend
  python model/setup_dataset.py
"""

from pathlib import Path
import sys

# Fix Windows console encoding for Unicode output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        pass

DATA_DIR = Path("data/train")
IMG_EXTS = ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG")

CLASSES = {
    "melanoma":     "Melanoma / suspicious mole images",
    "non_melanoma": "Non-melanoma: normal moles, BCC, SCC, keratosis",
    "acne":         "Acne / pimple images (optional)",
    "healthy":      "Healthy/clear skin images (optional)",
}


def count_images(folder: Path) -> int:
    if not folder.exists():
        return 0
    total = 0
    for ext in IMG_EXTS:
        total += len(list(folder.glob(ext)))
    return total


def setup():
    print("\n" + "=" * 60)
    print("  SkinVision AI — Dataset Setup")
    print("=" * 60)

    # Create folders if they don't exist
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for cls in CLASSES:
        (DATA_DIR / cls).mkdir(exist_ok=True)

    print(f"\n📂 Dataset location: {DATA_DIR.resolve()}\n")

    all_good = True
    for cls, description in CLASSES.items():
        folder = DATA_DIR / cls
        count  = count_images(folder)
        path   = str(folder.resolve())

        if count == 0:
            status = "❌  EMPTY"
            tip    = "← Add images here"
            if cls in ("melanoma", "non_melanoma"):
                all_good = False
        elif count < 20:
            status = f"⚠️   {count:4d} images"
            tip    = f"← Add more (need 20+)"
            if cls in ("melanoma", "non_melanoma"):
                all_good = False
        elif count < 50:
            status = f"🟡  {count:4d} images"
            tip    = "← OK but more = better"
        else:
            status = f"✅  {count:4d} images"
            tip    = "← Good!"

        print(f"  {cls:<20s} {status:<20s} {tip}")
        print(f"  {'':20s} {description}")
        print(f"  {'':20s} Path: {path}")
        print()

    print("=" * 60)

    if not all_good:
        print("""
📥  WHERE TO GET FREE MELANOMA IMAGES:

  1. ISIC Archive (best source):
     https://challenge.isic-archive.com/data/
     → Download "ISIC 2019" or "ISIC 2020"
     → Labels: MEL = melanoma, NV = nevus (non-melanoma)

  2. Kaggle - Skin Lesion Analysis:
     https://www.kaggle.com/datasets/kmader/skin-lesion-analysis-toward-melanoma-detection
     → Free download with Kaggle account

  3. DermNet NZ:
     https://dermnet.com/
     → Free educational skin images

📁  HOW TO ORGANIZE YOUR IMAGES:

  ┌─ Put melanoma images in:
  │    data/train/melanoma/
  │    (rename files: mel_001.jpg, mel_002.jpg, ...)
  │
  └─ Put non-melanoma images in:
       data/train/non_melanoma/
       (rename files: nonmel_001.jpg, nonmel_002.jpg, ...)

  Then run:  python model/train_model.py
""")
    else:
        print("""
✅  Dataset looks ready!

Run training:
  cd backend
  python model/train_model.py

This will take 15–60 minutes depending on your GPU/CPU.
""")


if __name__ == "__main__":
    setup()
