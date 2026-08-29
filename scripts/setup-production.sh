#!/usr/bin/env bash
# One-command production database + Vercel setup for राजनीति का अखाड़ा
#
# Usage:
#   export DATABASE_URL='postgresql://user:pass@host/db?sslmode=require'
#   export VERCEL_TOKEN='...'          # optional — from vercel.com/account/tokens
#   ./scripts/setup-production.sh
#
# Or pass DATABASE_URL inline:
#   DATABASE_URL='postgresql://...' ./scripts/setup-production.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROJECT_NAME="${VERCEL_PROJECT_NAME:-rajniti-ka-akhada}"
SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://rajnitikaakhada.in}"

echo "═══════════════════════════════════════════════════════════"
echo "  राजनीति का अखाड़ा — Production Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── 1. DATABASE_URL (required) ──────────────────────────────────────────────
if [ -z "${DATABASE_URL:-}" ]; then
  cat <<'EOF'

❌ DATABASE_URL is not set.

Simplest path (pick ONE):

  A) Vercel Storage (recommended — auto-injects DATABASE_URL):
     1. Open https://vercel.com/dashboard/stores
     2. Create → Postgres (Neon)
     3. Connect to your rajniti-ka-akhada project
     4. Redeploy — migrations run automatically on build

  B) Neon free tier (manual):
     1. Sign up at https://neon.tech
     2. Create project → copy "Connection string" (pooled, with ?sslmode=require)
     3. Run:
          export DATABASE_URL='postgresql://...'
          ./scripts/setup-production.sh

  C) Send your DATABASE_URL to the agent / paste in Vercel env vars, then redeploy.

EOF
  exit 1
fi

echo "✓ DATABASE_URL is set"
echo ""

# ── 2. Run migrations + seed ────────────────────────────────────────────────
echo "→ Running prisma migrate deploy..."
npx prisma migrate deploy

echo ""
echo "→ Seeding demo admin users and articles..."
npm run db:seed

echo ""
echo "✓ Database ready"
echo "   Admin:  admin@rajnitikaakhada.in / Admin@12345"
echo "   Editor: editor@rajnitikaakhada.in / Editor@12345"
echo ""

# ── 3. Generate secrets if missing ──────────────────────────────────────────
if [ -z "${AUTH_SECRET:-}" ]; then
  AUTH_SECRET="$(openssl rand -base64 48 | tr -d '/+=' | head -c 48)"
  echo "→ Generated AUTH_SECRET (save this):"
  echo "   $AUTH_SECRET"
  echo ""
fi

if [ -z "${CRON_SECRET:-}" ]; then
  CRON_SECRET="$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"
  echo "→ Generated CRON_SECRET (save this):"
  echo "   $CRON_SECRET"
  echo ""
fi

# ── 4. Push to Vercel (optional) ────────────────────────────────────────────
if [ -z "${VERCEL_TOKEN:-}" ]; then
  cat <<EOF
⚠ VERCEL_TOKEN not set — skipping Vercel CLI push.

Add these in Vercel Dashboard → Project → Settings → Environment Variables
(for Production, Preview, and Development):

  DATABASE_URL          = (your connection string)
  AUTH_SECRET           = $AUTH_SECRET
  CRON_SECRET           = $CRON_SECRET
  NEXT_PUBLIC_SITE_URL  = $SITE_URL
  STORAGE_PROVIDER      = cloudinary   (or s3 — local uploads don't work on Vercel)

Then redeploy. Migrations run automatically during build.

Get a token for future CLI use: https://vercel.com/account/tokens
EOF
  exit 0
fi

echo "→ Linking Vercel project (if needed)..."
npx vercel link --yes --project "$PROJECT_NAME" --token "$VERCEL_TOKEN" 2>/dev/null || true

push_env() {
  local name="$1"
  local value="$2"
  echo "   $name"
  printf '%s' "$value" | npx vercel env add "$name" production --force --token "$VERCEL_TOKEN" 2>/dev/null || \
    printf '%s' "$value" | npx vercel env add "$name" production --token "$VERCEL_TOKEN"
  printf '%s' "$value" | npx vercel env add "$name" preview --force --token "$VERCEL_TOKEN" 2>/dev/null || \
    printf '%s' "$value" | npx vercel env add "$name" preview --token "$VERCEL_TOKEN" 2>/dev/null || true
}

echo ""
echo "→ Pushing environment variables to Vercel..."
push_env "DATABASE_URL" "$DATABASE_URL"
push_env "AUTH_SECRET" "$AUTH_SECRET"
push_env "CRON_SECRET" "$CRON_SECRET"
push_env "NEXT_PUBLIC_SITE_URL" "$SITE_URL"
push_env "STORAGE_PROVIDER" "${STORAGE_PROVIDER:-cloudinary}"

echo ""
echo "→ Deploying to production..."
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"

echo ""
echo "✅ Done! Visit $SITE_URL/admin/login"
echo "   Login: admin@rajnitikaakhada.in / Admin@12345"
