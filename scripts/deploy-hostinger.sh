#!/usr/bin/env bash
set -euo pipefail

DOMAIN="darkred-sparrow-645513.hostingersite.com"
BASE="/home/u358087675/domains/${DOMAIN}"
PUBLIC_HTML="${BASE}/public_html"
NODE_APP="${BASE}/hbuilds/current/nodejs"
REPO_DIR="${BASE}/repos/NewsPulse-AI"

echo "==> Deploy Newsplus to ${DOMAIN}"

mkdir -p "${BASE}/repos"
if [ ! -d "${REPO_DIR}/.git" ]; then
  git clone "https://github.com/Adhammansouri/NewsPulse-AI.git" "${REPO_DIR}"
fi

cd "${REPO_DIR}"
git fetch origin main
git reset --hard origin/main

npm ci
npm run build -w newsplus-API
npm run build -w newsplus-front

mkdir -p "${NODE_APP}"
rsync -a --delete \
  --exclude node_modules \
  --exclude .git \
  newsplus-API/ "${NODE_APP}/"

cat > "${NODE_APP}/.env" <<'EOF'
HOST=0.0.0.0
CORS_ORIGIN=https://darkred-sparrow-645513.hostingersite.com
NODE_ENV=production
EOF

cd "${NODE_APP}"
npm ci --omit=dev
npm run build

rsync -a --delete newsplus-front/dist/ "${PUBLIC_HTML}/"
cp "${REPO_DIR}/scripts/hostinger-public.htaccess" "${PUBLIC_HTML}/.htaccess"

mkdir -p "${NODE_APP}/tmp"
touch "${NODE_APP}/tmp/restart.txt"

echo "==> Deploy complete"
