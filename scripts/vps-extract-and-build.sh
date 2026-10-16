#!/usr/bin/env bash
set -euo pipefail
APP=/opt/newsplus
ARCHIVE=/tmp/newsplus-vps-src.tgz
ENV_BACK=""
if [ -f "${APP}/.env" ]; then
  ENV_BACK="$(mktemp)"
  cp "${APP}/.env" "${ENV_BACK}"
fi
mkdir -p "${APP}"
tar -xzf "${ARCHIVE}" -C "${APP}"
if [ -n "${ENV_BACK}" ]; then
  cp "${ENV_BACK}" "${APP}/.env"
  rm -f "${ENV_BACK}"
fi
cd "${APP}"
docker compose -f docker-compose.vps.yml up -d --build --remove-orphans
docker compose -f docker-compose.vps.yml ps
