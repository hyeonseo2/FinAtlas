#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/frontend"

echo "[serve] installing deps if needed"
npm install --silent

echo "[serve] starting dev server for other devices"
echo "[serve] URL: http://$(hostname -I | awk '{print $1}'):4173"

npm run dev -- --host 0.0.0.0 --port 4173
