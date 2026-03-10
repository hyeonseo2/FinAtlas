#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

if [[ -z "${FINLIFE_API_KEY:-}" ]]; then
  echo "[warn] FINLIFE_API_KEY is not set. pipeline skipped."
else
  echo "[info] running pipeline..."
  PYTHONPATH=. python3 -m scripts.run_pipeline
fi

cd frontend
npm install
npm run dev
