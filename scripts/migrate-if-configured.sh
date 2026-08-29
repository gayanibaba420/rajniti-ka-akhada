#!/usr/bin/env bash
# Run Prisma migrations during Vercel build when DATABASE_URL is available.
set -euo pipefail

if [ -n "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL detected — checking migration status..."
  if npx prisma migrate status 2>/dev/null | grep -q "Database schema is up to date"; then
    echo "Database schema is up to date — skipping prisma migrate deploy."
  else
    echo "Running prisma migrate deploy..."
    npx prisma migrate deploy
  fi
else
  echo "DATABASE_URL not set — skipping prisma migrate deploy (tables will be created on first deploy after you add DATABASE_URL)."
fi
