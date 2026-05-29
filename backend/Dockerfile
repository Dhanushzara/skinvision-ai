# SkinVision AI — Backend Dockerfile
# Supports: demo mode (no GPU needed) + optional TensorFlow inference

FROM python:3.12-slim

WORKDIR /app

# System deps for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .

# Install base deps (no tensorflow by default for smaller image)
RUN pip install --no-cache-dir \
    fastapi>=0.111.0 \
    "uvicorn[standard]>=0.29.0" \
    pillow>=10.3.0 \
    opencv-python-headless>=4.9.0 \
    python-multipart>=0.0.9 \
    "numpy>=1.26.0" \
    scipy>=1.13.0

# Optional: install tensorflow if TF_INSTALL=1 build arg is set
ARG TF_INSTALL=0
RUN if [ "$TF_INSTALL" = "1" ]; then \
    pip install --no-cache-dir tensorflow-cpu==2.16.1; \
    fi

COPY . .

# Create required directories
RUN mkdir -p uploads models data/train/melanoma data/train/non_melanoma \
    data/train/acne data/train/healthy

EXPOSE 8000

CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
