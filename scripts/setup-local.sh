#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[setup-local] 1/5 Installing dependencies..."
pnpm install

if [[ ! -f .env ]]; then
  echo "[setup-local] 2/5 Creating .env from .env.example..."
  cp .env.example .env
  echo "[setup-local]    -> Please review .env values (especially DATABASE_URL and API keys)."
else
  echo "[setup-local] 2/5 .env already exists, skipping copy"
fi

echo "[setup-local] 3/5 Running database migrations..."
pnpm db:push

echo "[setup-local] 4/5 Running type-check..."
pnpm -s tsc --noEmit

echo "[setup-local] 5/5 Done. Start app with: pnpm dev"
echo "[setup-local] Health check endpoint: http://localhost:3000/api/health"
