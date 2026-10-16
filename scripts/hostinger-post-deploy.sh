#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/alt/alt-nodejs22/root/bin:/usr/bin:/bin:$PATH"

DOMAIN="deepskyblue-ibis-463603.hostingersite.com"
BASE="/home/u358087675/domains/${DOMAIN}"
PUBLIC_HTML="${BASE}/public_html"
NODE_APP="${BASE}/hbuilds/current/nodejs"
REPO_DIR="${BASE}/repos/NewsPulse-AI"
LOG_FILE="${BASE}/logs/post-deploy.log"
ENV_DIR="${BASE}/hbuilds/config"
ENV_FILE="${ENV_DIR}/.env"
SITE_URL="https://${DOMAIN}"

mkdir -p "${BASE}/logs" "${ENV_DIR}"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "${LOG_FILE}"
}

ensure_env_file() {
  if [ ! -f "${ENV_FILE}" ]; then
    log "Creating Hostinger env file"
    cat > "${ENV_FILE}" <<EOF
NODE_ENV=production
HOST=0.0.0.0
CORS_ORIGIN=${SITE_URL}
EOF
  fi

  if ! grep -q '^JWT_SECRET=' "${ENV_FILE}"; then
    printf "JWT_SECRET='%s'\n" "$(openssl rand -hex 32)" >> "${ENV_FILE}"
    log "Generated JWT_SECRET in Hostinger env"
  fi

  if ! grep -q '^CORS_ORIGIN=' "${ENV_FILE}"; then
    printf "CORS_ORIGIN='%s'\n" "${SITE_URL}" >> "${ENV_FILE}"
  fi

  if ! grep -q '^NODE_ENV=' "${ENV_FILE}"; then
    printf "NODE_ENV=production\n" >> "${ENV_FILE}"
  fi

  if ! grep -q '^NODE_OPTIONS=' "${ENV_FILE}"; then
    printf "NODE_OPTIONS=--experimental-sqlite\n" >> "${ENV_FILE}"
  fi
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

log "Building API"
npm run build --workspace=newsplus-API

log "Building frontend"
if ! npm run build --workspace=newsplus-front; then
  log "WARN: Vite build failed on shared hosting (resource limits). Keep existing dist or run scripts/ssh-deploy-deepskyblue.sh from your PC."
fi

if [ ! -f "${REPO_DIR}/newsplus-front/dist/index.html" ]; then
  log "ERROR: frontend dist missing — run scripts/ssh-deploy-deepskyblue.sh from a dev machine"
  exit 1
fi

log "Syncing frontend to public_html"
rsync -a --delete "${REPO_DIR}/newsplus-front/dist/" "${PUBLIC_HTML}/"
cp "${REPO_DIR}/scripts/hostinger-public.deepskyblue.htaccess" "${PUBLIC_HTML}/.htaccess"

ensure_env_file

PRELOAD_FILE="${ENV_DIR}/preload-timestamp.js"
if [ ! -f "${PRELOAD_FILE}" ]; then
  cp "${REPO_DIR}/scripts/hostinger-preload-timestamp.js" "${PRELOAD_FILE}"
  log "Installed preload-timestamp.js"
fi

if [ -f "${NODE_APP}/package.json" ]; then
  log "Installing API runtime dependencies"
  cd "${NODE_APP}"
  npm install --omit=dev

  log "Syncing API dist into NODE_APP"
  rsync -a "${REPO_DIR}/newsplus-API/dist/" "${NODE_APP}/dist/"
  cp "${REPO_DIR}/newsplus-API/server.cjs" "${REPO_DIR}/newsplus-API/server.js" "${REPO_DIR}/newsplus-API/package.json" "${NODE_APP}/"

  log "Syncing frontend into Node public/"
  mkdir -p "${NODE_APP}/public"
  rsync -a --delete "${REPO_DIR}/newsplus-front/dist/" "${NODE_APP}/public/"

  cp "${ENV_FILE}" "${NODE_APP}/.env"
  chmod 600 "${NODE_APP}/.env"

  mkdir -p tmp
  touch tmp/restart.txt
  log "Triggered Node.js restart"
else
  log "WARN: NODE_APP not found at ${NODE_APP}; skipped API sync"
fi

log "==> Post-deploy complete"
