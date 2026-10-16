#!/usr/bin/env bash
set -euo pipefail
ENV="/home/u358087675/domains/deepskyblue-ibis-463603.hostingersite.com/hbuilds/config/.env"
NODE_ENV="/home/u358087675/domains/deepskyblue-ibis-463603.hostingersite.com/hbuilds/current/nodejs/.env"
SRC="/tmp/newsplus-oai.env"
[ -f "${SRC}" ] || exit 0
while IFS= read -r line || [ -n "${line}" ]; do
  [ -n "${line}" ] || continue
  key="${line%%=*}"
  for file in "${ENV}" "${NODE_ENV}"; do
    [ -f "${file}" ] || continue
    if ! grep -q "^${key}=" "${file}"; then
      echo "${line}" >> "${file}"
    fi
  done
done < "${SRC}"
chmod 600 "${ENV}" "${NODE_ENV}" 2>/dev/null || true
mkdir -p "$(dirname "${NODE_ENV}")/tmp"
touch "$(dirname "${NODE_ENV}")/tmp/restart.txt"
echo oai-merge-ok
