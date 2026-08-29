#!/usr/bin/env bash
# Set Cloudinary credentials on Vercel (production + preview) and redeploy.
#
# Usage:
#   export VERCEL_TOKEN='your-token-from-https://vercel.com/account/tokens'
#   export CLOUDINARY_CLOUD_NAME='your-cloud-name'
#   export CLOUDINARY_API_KEY='your-api-key'
#   export CLOUDINARY_API_SECRET='your-api-secret'
#   ./scripts/set-cloudinary-vercel.sh
#
# Or pass inline:
#   VERCEL_TOKEN='...' CLOUDINARY_CLOUD_NAME='...' CLOUDINARY_API_KEY='...' \
#     CLOUDINARY_API_SECRET='...' ./scripts/set-cloudinary-vercel.sh

set -euo pipefail

PROJECT_ID="${VERCEL_PROJECT_ID:-prj_daArWy88k3yBaR646ofo6zKO3FDe}"
TEAM_ID="${VERCEL_TEAM_ID:-team_V1AzY3JImXWNnLWQjn3sPDSS}"
PROJECT_NAME="${VERCEL_PROJECT_NAME:-rajniti-ka-akhada-lh2u}"

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "❌ VERCEL_TOKEN required — create at https://vercel.com/account/tokens"
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

echo "→ Setting storage env vars on Vercel project ${PROJECT_NAME}..."
upsert_env "STORAGE_PROVIDER" "cloudinary" "sensitive"
upsert_env "CLOUDINARY_FOLDER" "rajniti-ka-akhada" "plain"

if [ -n "${CLOUDINARY_CLOUD_NAME:-}" ] && [ -n "${CLOUDINARY_API_KEY:-}" ] && [ -n "${CLOUDINARY_API_SECRET:-}" ]; then
  upsert_env "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME" "sensitive"
  upsert_env "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY" "sensitive"
  upsert_env "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET" "sensitive"
  echo ""
  echo "✓ All Cloudinary credentials set."
else
  echo ""
  echo "⚠ Cloudinary credentials not provided — file uploads will stay disabled until you set:"
  echo "   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
  echo "   Re-run this script with those exports, or add them in:"
  echo "   https://vercel.com/pradeep-ea49/rajniti-ka-akhada-lh2u/settings/environment-variables"
fi

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
