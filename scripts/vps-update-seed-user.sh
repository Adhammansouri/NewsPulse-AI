#!/usr/bin/env bash
set -euo pipefail
ENV="${1:-/opt/newsplus/.env}"
IDENTIFIER="${2:?identifier}"
EMAIL="${3:?email}"
DISPLAY_NAME="${4:?display name}"
PASSWORD="${5:?password}"

touch "${ENV}"
for pair in \
  "AUTH_SEED_IDENTIFIER=${IDENTIFIER}" \
  "AUTH_SEED_EMAIL=${EMAIL}" \
  "AUTH_SEED_DISPLAY_NAME=${DISPLAY_NAME}" \
  "AUTH_SEED_PASSWORD=${PASSWORD}"; do
  key="${pair%%=*}"
  if grep -q "^${key}=" "${ENV}"; then
    sed -i "s|^${key}=.*|${pair}|" "${ENV}"
  else
    echo "${pair}" >> "${ENV}"
  fi
done

cd /opt/newsplus
docker compose -f docker-compose.vps.yml up -d --force-recreate app
