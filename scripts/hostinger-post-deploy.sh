#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/alt/alt-nodejs20/root/bin:$PATH"

DOMAIN="deepskyblue-ibis-463603.hostingersite.com"
APP="/home/u358087675/domains/${DOMAIN}/hbuilds/current/nodejs"

if [ ! -f "${APP}/package.json" ]; then
  exit 0
fi

if [ ! -d "${APP}/node_modules" ]; then
  cd "${APP}"
  npm ci --omit=dev
  mkdir -p tmp
  touch tmp/restart.txt
fi
