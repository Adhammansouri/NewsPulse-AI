#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/bin:/bin:/opt/alt/alt-nodejs20/root/bin:$PATH"

DOMAIN="deepskyblue-ibis-463603.hostingersite.com"
BASE="/home/u358087675/domains/${DOMAIN}"
PUBLIC_HTML="${BASE}/public_html"
NODE_APP="${BASE}/hbuilds/current/nodejs"
ENV_DIR="${BASE}/hbuilds/config"
ENV_FILE="${ENV_DIR}/.env"
SITE_URL="https://${DOMAIN}"
LOG_FILE="${BASE}/logs/post-deploy.log"

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
}

log "==> Finish deploy (CI artifacts)"

if [ ! -f "${NODE_APP}/package.json" ]; then
  log "ERROR: NODE_APP missing at ${NODE_APP}"
  exit 1
fi

ensure_env_file

PRELOAD_FILE="${ENV_DIR}/preload-timestamp.js"
if [ ! -f "${PRELOAD_FILE}" ]; then
  if [ -f "${BASE}/repos/NewsPulse-AI/scripts/hostinger-preload-timestamp.js" ]; then
    cp "${BASE}/repos/NewsPulse-AI/scripts/hostinger-preload-timestamp.js" "${PRELOAD_FILE}"
    log "Installed preload-timestamp.js"
  else
    printf '// preload stub\n' > "${PRELOAD_FILE}"
    log "Wrote minimal preload-timestamp.js"
  fi
fi

if [ -f "${BASE}/repos/NewsPulse-AI/scripts/hostinger-public.deepskyblue.htaccess" ]; then
  cp "${BASE}/repos/NewsPulse-AI/scripts/hostinger-public.deepskyblue.htaccess" "${PUBLIC_HTML}/.htaccess"
fi

cd "${NODE_APP}"
npm install --omit=dev
cp "${ENV_FILE}" "${NODE_APP}/.env"
chmod 600 "${NODE_APP}/.env"
mkdir -p tmp
touch tmp/restart.txt

log "==> Finish deploy complete"
