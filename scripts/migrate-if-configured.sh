#!/usr/bin/env bash
# Run Prisma migrations during Vercel build when DATABASE_URL is available.
set -euo pipefail

if [ -n "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL detected — running prisma migrate deploy..."
  npx prisma migrate deploy
else
  echo "DATABASE_URL not set — skipping prisma migrate deploy (tables will be created on first deploy after you add DATABASE_URL)."
fi
