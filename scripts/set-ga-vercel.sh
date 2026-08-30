#!/usr/bin/env bash
# Set Google Analytics 4 measurement ID on Vercel (production + preview) and redeploy.
#
# Usage:
#   export VERCEL_TOKEN='your-token-from-https://vercel.com/account/tokens'
#   export NEXT_PUBLIC_GA_ID='G-XXXXXXXXXX'
#   ./scripts/set-ga-vercel.sh
#
# Or pass inline:
#   VERCEL_TOKEN='...' NEXT_PUBLIC_GA_ID='G-XXXXXXXXXX' ./scripts/set-ga-vercel.sh

set -euo pipefail

PROJECT_ID="${VERCEL_PROJECT_ID:-prj_daArWy88k3yBaR646ofo6zKO3FDe}"
TEAM_ID="${VERCEL_TEAM_ID:-team_V1AzY3JImXWNnLWQjn3sPDSS}"
PROJECT_NAME="${VERCEL_PROJECT_NAME:-rajniti-ka-akhada-lh2u}"

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "❌ VERCEL_TOKEN required — create at https://vercel.com/account/tokens"
  exit 1
fi

if [ -z "${NEXT_PUBLIC_GA_ID:-}" ]; then
  echo "❌ NEXT_PUBLIC_GA_ID required — create a GA4 property at https://analytics.google.com"
  echo "   Copy the Measurement ID (format G-XXXXXXXXXX). Do not commit or print it in logs."
  exit 1
fi

if ! [[ "$NEXT_PUBLIC_GA_ID" =~ ^G-[A-Z0-9]+$ ]]; then
  echo "❌ NEXT_PUBLIC_GA_ID must look like G-XXXXXXXXXX (letters/digits after G-)"
  exit 1
fi

upsert_env() {
  local key="$1"
  local value="$2"
  local type="${3:-plain}"
  curl -sf -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}&upsert=true" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "[{\"key\":\"${key}\",\"value\":\"${value}\",\"type\":\"${type}\",\"target\":[\"production\",\"preview\"]}]" >/dev/null
  echo "✓ ${key}"
}

echo "→ Setting NEXT_PUBLIC_GA_ID on Vercel project ${PROJECT_NAME}..."
upsert_env "NEXT_PUBLIC_GA_ID" "$NEXT_PUBLIC_GA_ID" "plain"

echo ""
echo "→ Triggering production redeploy..."
LATEST=$(curl -sf -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  "https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=1&target=production" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['deployments'][0]['uid'])")

NEW=$(curl -sf -X POST "https://api.vercel.com/v13/deployments?teamId=${TEAM_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"deploymentId\":\"${LATEST}\",\"name\":\"${PROJECT_NAME}\",\"target\":\"production\"}" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['id'])")

echo "✓ Deployment started: ${NEW}"
echo "  Dashboard: https://vercel.com/pradeep-ea49/${PROJECT_NAME}"
echo ""
echo "After deploy completes (~1–2 min), visit https://www.rajnitikaakhada.com,"
echo "accept the cookie banner (स्वीकार करें), then check Realtime in GA4."
