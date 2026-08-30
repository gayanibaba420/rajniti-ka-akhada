#!/usr/bin/env bash
# Run Prisma migrations during Vercel build when DATABASE_URL is available.
set -euo pipefail

if [ -n "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL detected — checking migration status..."

  # Resolve failed migrations when schema already matches (e.g. db push before migrate).
  node scripts/repair-failed-migrations.mjs || true

  if npx prisma migrate status 2>/dev/null | grep -q "Database schema is up to date"; then
    echo "Database schema is up to date — skipping prisma migrate deploy."
  else
    echo "Running prisma migrate deploy..."
    if ! npx prisma migrate deploy; then
      echo "migrate deploy failed — attempting repair and retry..."
      node scripts/repair-failed-migrations.mjs || true
      if npx prisma migrate deploy; then
        echo "migrate deploy succeeded after repair."
      else
        echo "migrate deploy still failed (often advisory lock on Neon) — falling back to db push..."
        npx prisma db push --skip-generate
      fi
    fi
  fi
else
  echo "DATABASE_URL not set — skipping prisma migrate deploy (tables will be created on first deploy after you add DATABASE_URL)."
fi
