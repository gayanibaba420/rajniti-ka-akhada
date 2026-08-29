#!/usr/bin/env bash
set -euo pipefail

# Rajniti Ka Akhada — EC2 backend deploy script
# Usage: ./deploy-ec2.sh

APP_DIR="${APP_DIR:-/var/www/rajniti-api}"
BRANCH="${BRANCH:-main}"
REPO_URL="${REPO_URL:-git@github.com:YOUR_ORG/rajniti-ka-akhada.git}"

echo "==> Deploying backend to ${APP_DIR}"

sudo mkdir -p "${APP_DIR}"
sudo chown -R "$USER:$USER" "${APP_DIR}"

if [ ! -d "${APP_DIR}/.git" ]; then
  git clone "${REPO_URL}" "${APP_DIR}"
fi

cd "${APP_DIR}/backend"

git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull origin "${BRANCH}"

npm ci
npm run db:migrate
npm run build

if pm2 describe rajniti-api >/dev/null 2>&1; then
  pm2 reload rajniti-api
else
  pm2 start dist/index.js --name rajniti-api --cwd "${APP_DIR}/backend"
fi

pm2 save
echo "==> Backend deployed. Health: curl http://127.0.0.1:4000/health"
