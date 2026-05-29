"""
SkinVision — Dataset Auto-Organizer
====================================
Scans ANY downloaded skin dataset folder (with any subfolder structure / variant names)
and copies images into the correct training folders:

    data/train/melanoma/
    data/train/non_melanoma/
    data/train/acne/          (eczema / atopic dermatitis / inflammatory)
    data/train/healthy/

Usage:
    python model/organize_dataset.py "C:/Users/DHANUSH/Downloads/skin-dataset"

    # Dry run first (shows what WOULD be copied, no actual copy):
    python model/organize_dataset.py "C:/Users/DHANUSH/Downloads/skin-dataset" --dry-run

    # Limit healthy images (NV has 7000+ — too many slows training):
    python model/organize_dataset.py "C:/path" --max-healthy 2000
"""

import argparse
import shutil
import sys
import os
from collections import defaultdict
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# ── Keyword → class mapping ───────────────────────────────────────────────────
# Any folder whose name CONTAINS one of these keywords (case-insensitive)
# gets mapped to the corresponding class.

KEYWORD_MAP = {
    "melanoma": [
        "melanoma", "mel_", "_mel",
        "superficial", "nodular", "lentigo", "acral",
        "mucosal_melanoma", "desmoplastic",
    ],
    "non_melanoma": [
        "basal", "bcc", "squamous", "scc",
        "akiec", "actinic", "keratosis",
        "carcinoma", "wart", "molluscum", "viral",
        "vascular", "angioma", "dermatofibroma", " df",
        "seborrheic", "seborrhoeic",
        "benign_keratosis", "bkl",
    ],
    "acne": [
        "eczema", "atopic", "dermatitis", "psoriasis",
        "lichen", "rosacea", "acne", "pimple",
        "inflammatory", "folliculitis",
    ],
    "healthy": [
        "nevi", "nv", "naevi", "nevus", "mole", "benign_mole",
        "healthy", "normal", "clear", "no_disease",
        "melanocytic", "dermatofibroma",
    ],
}

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}

# ── Helpers ───────────────────────────────────────────────────────────────────

def classify_folder(folder_name: str) -> str | None:
    """Return class name for a folder, or None if unknown."""
    name_lower = folder_name.lower()
    for cls, keywords in KEYWORD_MAP.items():
        for kw in keywords:
            if kw.lower() in name_lower:
                return cls
    return None


def collect_images(folder: Path) -> list[Path]:
    """Recursively collect all image files in a folder."""
    imgs = []
    for f in folder.rglob("*"):
        if f.is_file() and f.suffix.lower() in IMAGE_EXTS:
            imgs.append(f)
    return imgs


def safe_copy(src: Path, dest_dir: Path, dry_run: bool) -> bool:
    """Copy src → dest_dir / src.name (add suffix if conflict)."""
    dest = dest_dir / src.name
    if dest.exists():
        # avoid overwrite by appending parent folder name
        dest = dest_dir / f"{src.parent.name}_{src.name}"
    if dest.exists():
        return False  # skip exact duplicate path
    if not dry_run:
        shutil.copy2(src, dest)
    return True


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Organize skin dataset into training folders")
    parser.add_argument("source", help="Path to downloaded dataset root folder")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview only — do not copy any files")
    parser.add_argument("--max-healthy", type=int, default=2000,
                        help="Max healthy images to copy (default 2000 — NV has 7000+)")
    parser.add_argument("--output", default=None,
                        help="Output root (default: backend/data/train/)")
    parser.add_argument("--yes", "-y", action="store_true",
                        help="Skip confirmation prompt")
    args = parser.parse_args()

    source_root = Path(args.source)
    if not source_root.exists():
        print(f"[ERROR] Folder not found: {source_root}")
        sys.exit(1)

    # Output folders
    script_dir = Path(__file__).parent.parent   # backend/
    out_root = Path(args.output) if args.output else script_dir / "data" / "train"
    class_dirs = {
        cls: out_root / cls
        for cls in ["melanoma", "non_melanoma", "acne", "healthy"]
    }
    if not args.dry_run:
        for d in class_dirs.values():
            d.mkdir(parents=True, exist_ok=True)

    print("\n" + "=" * 60)
    print("  SkinVision Dataset Organizer")
    print("=" * 60)
    print(f"  Source : {source_root}")
    print(f"  Output : {out_root}")
    print(f"  Mode   : {'DRY RUN (no files copied)' if args.dry_run else 'COPY'}")
    print("=" * 60)

    # ── Step 1: scan all immediate subfolders ─────────────────────────────────
    all_subfolders = [f for f in source_root.rglob("*") if f.is_dir()]

    # Build mapping: class → list of (folder, images)
    plan: dict[str, list[tuple[Path, list[Path]]]] = defaultdict(list)
    skipped_folders: list[Path] = []

    for folder in all_subfolders:
        cls = classify_folder(folder.name)
        if cls:
            imgs = collect_images(folder)
            if imgs:
                plan[cls].append((folder, imgs))
        else:
            # Check if it directly contains images (leaf folder)
            direct_imgs = [f for f in folder.iterdir()
                           if f.is_file() and f.suffix.lower() in IMAGE_EXTS]
            if direct_imgs:
                skipped_folders.append(folder)

    # ── Step 2: show plan ─────────────────────────────────────────────────────
    print("\n  MATCHED FOLDERS")
    print("-" * 60)
    total_by_class: dict[str, int] = defaultdict(int)

    for cls in ["melanoma", "non_melanoma", "acne", "healthy"]:
        entries = plan.get(cls, [])
        count = sum(len(imgs) for _, imgs in entries)
        cap = args.max_healthy if cls == "healthy" else count
        actual = min(count, cap)
        total_by_class[cls] = actual

        if entries:
            print(f"\n  [{cls.upper()}]  ({actual} images will be copied)")
            for folder, imgs in entries:
                print(f"    + {folder.name:<45}  {len(imgs)} images")
            if cls == "healthy" and count > args.max_healthy:
                print(f"    * Capped at {args.max_healthy} (use --max-healthy N to change)")
        else:
            print(f"\n  [{cls.upper()}]  -- NO MATCHING FOLDERS FOUND --")

    # ── Step 3: show unknown folders ──────────────────────────────────────────
    if skipped_folders:
        print("\n" + "-" * 60)
        print("  UNRECOGNIZED FOLDERS (not copied — check manually):")
        for f in skipped_folders[:20]:
            imgs = [x for x in f.iterdir() if x.suffix.lower() in IMAGE_EXTS]
            print(f"    ? {f.name:<45}  {len(imgs)} images")
        if len(skipped_folders) > 20:
            print(f"    ... and {len(skipped_folders)-20} more")

    # ── Step 4: confirm ───────────────────────────────────────────────────────
    total_all = sum(total_by_class.values())
    print("\n" + "=" * 60)
    print(f"  TOTAL: {total_all} images across 4 classes")
    for cls, n in total_by_class.items():
        status = "OK" if n >= 100 else ("LOW" if n >= 20 else "TOO FEW")
        print(f"    {cls:<20} {n:>5} images  [{status}]")
    print("=" * 60)

    if args.dry_run:
        print("\n  DRY RUN complete. Run without --dry-run to copy files.\n")
        return

    if not args.yes:
        confirm = input("\n  Proceed with copy? (y/n): ").strip().lower()
        if confirm != "y":
            print("  Cancelled.")
            return

    # ── Step 5: copy ─────────────────────────────────────────────────────────
    print()
    for cls in ["melanoma", "non_melanoma", "acne", "healthy"]:
        entries = plan.get(cls, [])
        if not entries:
            continue
        dest_dir = class_dirs[cls]
        copied = 0
        limit = args.max_healthy if cls == "healthy" else 999_999

        for folder, imgs in entries:
            for img in imgs:
                if copied >= limit:
                    break
                if safe_copy(img, dest_dir, dry_run=False):
                    copied += 1
            if copied >= limit:
                break

        print(f"  {cls:<20}  {copied} images copied  ->  {dest_dir}")

    print("\n  Done! Now run training:")
    print("  docker exec -it skinvision-backend python model/train_model.py\n")


if __name__ == "__main__":
    main()
