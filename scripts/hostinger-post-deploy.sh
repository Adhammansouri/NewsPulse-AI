#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/bin:/bin:/opt/alt/alt-nodejs20/root/bin:$PATH"

DOMAIN="deepskyblue-ibis-463603.hostingersite.com"
BASE="/home/u358087675/domains/${DOMAIN}"
PUBLIC_HTML="${BASE}/public_html"
NODE_APP="${BASE}/hbuilds/current/nodejs"
REPO_DIR="${BASE}/repos/NewsPulse-AI"
LOG_FILE="${BASE}/logs/post-deploy.log"
ENV_FILE="${BASE}/hbuilds/config/.env"

mkdir -p "${BASE}/logs"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "${LOG_FILE}"
}

log "==> Post-deploy start"

mkdir -p "${BASE}/repos"
if [ ! -d "${REPO_DIR}/.git" ]; then
  log "Cloning repository"
  git clone "git@github.com:Adhammansouri/NewsPulse-AI.git" "${REPO_DIR}"
fi

cd "${REPO_DIR}"
git fetch origin main
git reset --hard origin/main

log "Installing workspace dependencies"
npm install --workspaces --include=dev --include=optional

log "Building frontend"
npm run build --workspace=newsplus-front

if [ ! -f "${REPO_DIR}/newsplus-front/dist/index.html" ]; then
  log "ERROR: frontend build missing index.html"
  exit 1
fi

log "Syncing frontend to public_html"
rsync -a --delete "${REPO_DIR}/newsplus-front/dist/" "${PUBLIC_HTML}/"
cp "${REPO_DIR}/scripts/hostinger-public.deepskyblue.htaccess" "${PUBLIC_HTML}/.htaccess"

if [ -f "${NODE_APP}/package.json" ]; then
  log "Installing API runtime dependencies"
  cd "${NODE_APP}"
  npm install --omit=dev

  log "Syncing frontend into Node public/"
  mkdir -p "${NODE_APP}/public"
  rsync -a --delete "${REPO_DIR}/newsplus-front/dist/" "${NODE_APP}/public/"

  if [ -f "${ENV_FILE}" ]; then
    if ! grep -q '^JWT_SECRET=' "${ENV_FILE}"; then
      printf "JWT_SECRET='%s'\n" "$(openssl rand -hex 32)" >> "${ENV_FILE}"
      log "Generated JWT_SECRET in Hostinger env"
    fi
    cp "${ENV_FILE}" "${NODE_APP}/.env"
    chmod 600 "${NODE_APP}/.env"
  fi

  mkdir -p tmp
  touch tmp/restart.txt
  log "Triggered Node.js restart"
fi

log "==> Post-deploy complete"
