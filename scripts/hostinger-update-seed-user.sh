#!/usr/bin/env bash
set -euo pipefail
BASE="/home/u358087675/domains/deepskyblue-ibis-463603.hostingersite.com"
ENV="${BASE}/hbuilds/config/.env"
NODE_ENV="${BASE}/hbuilds/current/nodejs/.env"
IDENTIFIER="${1:?identifier}"
EMAIL="${2:?email}"
DISPLAY_NAME="${3:?display name}"
PASSWORD="${4:?password}"

mkdir -p "$(dirname "${ENV}")"
touch "${ENV}"

for pair in \
  "AUTH_SEED_IDENTIFIER=${IDENTIFIER}" \
  "AUTH_SEED_EMAIL=${EMAIL}" \
  "AUTH_SEED_DISPLAY_NAME=${DISPLAY_NAME}" \
  "AUTH_SEED_PASSWORD=${PASSWORD}"; do
  key="${pair%%=*}"
  for file in "${ENV}" "${NODE_ENV}"; do
    touch "${file}"
    if grep -q "^${key}=" "${file}"; then
      sed -i "s|^${key}=.*|${pair}|" "${file}"
    else
      echo "${pair}" >> "${file}"
    fi
  done
done

chmod 600 "${ENV}" "${NODE_ENV}" 2>/dev/null || true
mkdir -p "${BASE}/hbuilds/current/nodejs/tmp"
touch "${BASE}/hbuilds/current/nodejs/tmp/restart.txt"
echo hostinger-seed-updated
