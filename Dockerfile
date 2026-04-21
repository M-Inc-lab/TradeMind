# TradeMind — Dockerfile
FROM python:3.12-slim-bookworm

LABEL maintainer="morningstar"
LABEL org.opencontainers.image.title="TradeMind"

ARG UID=1000 GID=1000

RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs npm curl git \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u $UID -g $GID -s /bin/bash trader \
    && mkdir -p /workspace /home/trader/.config \
    && chown -R $UID:$GID /workspace

WORKDIR /workspace
COPY --chown=$UID:$GID TradeMind/ /workspace/TradeMind/

USER trader
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production

CMD ["python3", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
