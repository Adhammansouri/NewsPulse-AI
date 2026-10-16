#!/usr/bin/env bash
set -euo pipefail

# Newsplus — independent VPS deploy (Docker + Caddy)
# Target: Ubuntu 24.04 VPS with Docker (e.g. Hostinger KVM)

APP_DIR="${NEWSPLUS_APP_DIR:-/opt/newsplus}"
REPO_URL="${NEWSPLUS_REPO_URL:-https://github.com/Adhammansouri/NewsPulse-AI.git}"
BRANCH="${NEWSPLUS_BRANCH:-main}"
DOMAIN="${NEWSPLUS_DOMAIN:-srv1930800.hstgr.cloud}"
COMPOSE_FILES="-f docker-compose.vps.yml"

log() {
  echo "[$(date -Iseconds)] $*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "ERROR: missing command: $1"
    exit 1
  fi
}

require_cmd docker
require_cmd git

if ! docker compose version >/dev/null 2>&1; then
  log "ERROR: docker compose plugin not found"
  exit 1
fi

mkdir -p "$(dirname "${APP_DIR}")"

if [ -d "${APP_DIR}/.git" ]; then
  log "Updating repository in ${APP_DIR}"
  git -C "${APP_DIR}" fetch origin "${BRANCH}"
  git -C "${APP_DIR}" reset --hard "origin/${BRANCH}"
elif [ ! -d "${APP_DIR}" ] || [ ! -f "${APP_DIR}/docker-compose.vps.yml" ]; then
  log "Cloning repository into ${APP_DIR}"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
else
  log "Using existing ${APP_DIR} (no git remote). Upload sources via scripts/vps-extract-and-build.sh"
fi

cd "${APP_DIR}"

if [ ! -f .env ]; then
  if [ -f .env.vps.example ]; then
    cp .env.vps.example .env
    if command -v openssl >/dev/null 2>&1; then
      JWT_SECRET="$(openssl rand -hex 32)"
      sed -i "s/^JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
    fi
    sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=https://${DOMAIN}|" .env
    log "Created .env from .env.vps.example — review secrets before going live"
  else
    log "ERROR: .env missing and .env.vps.example not found"
    exit 1
  fi
fi

log "Building and starting containers"
docker compose ${COMPOSE_FILES} up -d --build --remove-orphans

log "Waiting for health check"
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if docker compose ${COMPOSE_FILES} exec -T app node -e "fetch('http://127.0.0.1:3001/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    log "API healthy"
    break
  fi
  if [ "${attempt}" -eq 10 ]; then
    log "ERROR: API did not become healthy in time"
    docker compose ${COMPOSE_FILES} logs --tail=80
    exit 1
  fi
  sleep 5
done

log "Deploy complete"
log "Site: https://${DOMAIN}"
log "Health: https://${DOMAIN}/api/health"
docker compose ${COMPOSE_FILES} ps
