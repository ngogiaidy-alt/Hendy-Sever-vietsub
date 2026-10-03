# Production Dockerfile for Hendy Python Worker & VIETSUB PRO Engine
FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04 AS base

# Install system dependencies & FFmpeg for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    git \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV WORKSPACE_ROOT=/tmp/hendy_builds

CMD ["python3", "main.py"]
