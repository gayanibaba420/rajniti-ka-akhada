#!/usr/bin/env bash
# Set Gemini API key on Vercel (production + preview) and redeploy.
#
# Usage:
#   export VERCEL_TOKEN='your-token-from-https://vercel.com/account/tokens'
#   export GEMINI_API_KEY='your-gemini-api-key'
#   ./scripts/set-gemini-vercel.sh
#
# Or pass inline:
#   VERCEL_TOKEN='...' GEMINI_API_KEY='...' ./scripts/set-gemini-vercel.sh

set -euo pipefail

PROJECT_ID="${VERCEL_PROJECT_ID:-prj_daArWy88k3yBaR646ofo6zKO3FDe}"
TEAM_ID="${VERCEL_TEAM_ID:-team_V1AzY3JImXWNnLWQjn3sPDSS}"
PROJECT_NAME="${VERCEL_PROJECT_NAME:-rajniti-ka-akhada-lh2u}"

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "❌ VERCEL_TOKEN required — create at https://vercel.com/account/tokens"
  exit 1
fi

if [ -z "${GEMINI_API_KEY:-}" ]; then
  echo "❌ GEMINI_API_KEY required — get one from https://aistudio.google.com/apikey"
  echo "   Do not commit or print the key in logs."
  exit 1
fi

upsert_env() {
  local key="$1"
  local value="$2"
  local type="${3:-sensitive}"
  curl -sf -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}&upsert=true" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "[{\"key\":\"${key}\",\"value\":\"${value}\",\"type\":\"${type}\",\"target\":[\"production\",\"preview\"]}]" >/dev/null
  echo "✓ ${key}"
}

echo "→ Setting GEMINI_API_KEY on Vercel project ${PROJECT_NAME}..."
upsert_env "GEMINI_API_KEY" "$GEMINI_API_KEY" "sensitive"

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
