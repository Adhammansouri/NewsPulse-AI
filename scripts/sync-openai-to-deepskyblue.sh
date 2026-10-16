#!/usr/bin/env bash
# Run on VPS as root — copies OPENAI_* from /opt/newsplus/.env into Hostinger config if missing.
set -euo pipefail
VPS_ENV=/opt/newsplus/.env
H_ENV=/home/u358087675/domains/deepskyblue-ibis-463603.hostingersite.com/hbuilds/config/.env
NODE_ENV=/home/u358087675/domains/deepskyblue-ibis-463603.hostingersite.com/hbuilds/current/nodejs/.env

for file in "${H_ENV}" "${NODE_ENV}"; do
  [ -f "${file}" ] || continue
  for key in OPENAI_API_KEY OPENAI_ADMIN_KEY OPENAI_PROJECT_ID OPENAI_MODEL; do
    line="$(grep -m1 "^${key}=" "${VPS_ENV}" 2>/dev/null || true)"
    [ -n "${line}" ] || continue
    if ! grep -q "^${key}=" "${file}"; then
      echo "${line}" >> "${file}"
    fi
  done
  chmod 600 "${file}"
done
touch /home/u358087675/domains/deepskyblue-ibis-463603.hostingersite.com/hbuilds/current/nodejs/tmp/restart.txt 2>/dev/null || true
echo openai-sync-ok
