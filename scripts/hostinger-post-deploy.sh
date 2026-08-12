#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/bin:/bin:/opt/alt/alt-nodejs20/root/bin:$PATH"

DOMAIN="deepskyblue-ibis-463603.hostingersite.com"
BASE="/home/u358087675/domains/${DOMAIN}"
PUBLIC_HTML="${BASE}/public_html"
NODE_APP="${BASE}/hbuilds/current/nodejs"
REPO_DIR="${BASE}/repos/NewsPulse-AI"

if [ -f "${NODE_APP}/package.json" ] && [ ! -d "${NODE_APP}/node_modules" ]; then
  cd "${NODE_APP}"
  npm ci --omit=dev
  mkdir -p tmp
  touch tmp/restart.txt
fi

mkdir -p "${BASE}/repos"
if [ ! -d "${REPO_DIR}/.git" ]; then
  git clone "git@github.com:Adhammansouri/NewsPulse-AI.git" "${REPO_DIR}"
fi

cd "${REPO_DIR}"
git fetch origin main
git reset --hard origin/main

npm install --workspaces --include=dev --include=optional
npm run build --workspace=newsplus-front

rsync -a --delete "${REPO_DIR}/newsplus-front/dist/" "${PUBLIC_HTML}/"
cp "${REPO_DIR}/scripts/hostinger-public.deepskyblue.htaccess" "${PUBLIC_HTML}/.htaccess"
