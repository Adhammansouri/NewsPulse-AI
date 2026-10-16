#!/usr/bin/env bash
# Run on your machine when Hostinger shared hosting cannot run Vite (resource limits).
# Requires: local `npm run build`, scp/ssh to u358087675@213.130.145.182:65002
set -euo pipefail

HOST="${HOSTINGER_SSH_HOST:-213.130.145.182}"
PORT="${HOSTINGER_SSH_PORT:-65002}"
USER="${HOSTINGER_SSH_USER:-u358087675}"
DOMAIN="deepskyblue-ibis-463603.hostingersite.com"
BASE="/home/${USER}/domains/${DOMAIN}"
NODE_APP="${BASE}/hbuilds/current/nodejs"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "${REPO_ROOT}"
npm run build -w newsplus-API
npm run build -w newsplus-front

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
mkdir -p "${TMP}/public" "${TMP}/dist"
cp -a newsplus-front/dist/. "${TMP}/public/"
cp -a newsplus-API/dist/. "${TMP}/dist/"
cp newsplus-API/server.cjs newsplus-API/server.js newsplus-API/package.json "${TMP}/"

tar -czf "${TMP}/bundle.tgz" -C "${TMP}" .
scp -P "${PORT}" "${TMP}/bundle.tgz" "${USER}@${HOST}:/tmp/newsplus-ssh-deploy.tgz"

ssh -p "${PORT}" "${USER}@${HOST}" "set -euo pipefail
BASE=${BASE}
NODE_APP=${NODE_APP}
WORK=/tmp/newsplus-ssh-deploy
rm -rf \"\${WORK}\"
mkdir -p \"\${WORK}\"
tar -xzf /tmp/newsplus-ssh-deploy.tgz -C \"\${WORK}\"
rsync -a --delete \"\${WORK}/public/\" \"\${BASE}/public_html/\"
rsync -a --delete \"\${WORK}/public/\" \"\${NODE_APP}/public/\"
rsync -a --delete \"\${WORK}/dist/\" \"\${NODE_APP}/dist/\"
cp \"\${WORK}/server.cjs\" \"\${WORK}/server.js\" \"\${WORK}/package.json\" \"\${NODE_APP}/\"
cp \"\${BASE}/repos/NewsPulse-AI/scripts/hostinger-public.deepskyblue.htaccess\" \"\${BASE}/public_html/.htaccess\"
export PATH=/opt/alt/alt-nodejs22/root/bin:\$PATH
cd \"\${NODE_APP}\"
npm install --omit=dev
ENV=\${BASE}/hbuilds/config/.env
grep -q '^NODE_OPTIONS=' \"\${ENV}\" || echo 'NODE_OPTIONS=--experimental-sqlite' >> \"\${ENV}\"
cp \"\${ENV}\" \"\${NODE_APP}/.env\"
chmod 600 \"\${ENV}\" \"\${NODE_APP}/.env\"
mkdir -p tmp
touch tmp/restart.txt
echo ssh-deploy-ok
"

echo "Done. Check: https://${DOMAIN}/api/health"
