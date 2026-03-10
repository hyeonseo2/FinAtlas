#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <user>@<vm-ip-or-host> [port]"
  echo "Examples:"
  echo "  $0 ubuntu@203.0.113.10"
  echo "  $0 ubuntu@203.0.113.10 4173"
  exit 1
fi

TARGET="$1"
PORT="${2:-4173}"

echo "[tunnel] open: http://localhost:${PORT} -> ${TARGET}:${PORT}"
ssh -N -L "${PORT}:localhost:${PORT}" "$TARGET"
