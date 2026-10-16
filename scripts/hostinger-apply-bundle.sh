#!/usr/bin/env bash
set -euo pipefail
export PATH="/opt/alt/alt-nodejs22/root/bin:$PATH"
DOMAIN="deepskyblue-ibis-463603.hostingersite.com"
BASE="/home/u358087675/domains/${DOMAIN}"
NODE_APP="${BASE}/hbuilds/current/nodejs"
WORK=/tmp/newsplus-ssh-deploy
ARCHIVE=/tmp/newsplus-ssh-deploy.tgz
ENV="${BASE}/hbuilds/config/.env"

rm -rf "${WORK}"
mkdir -p "${WORK}"
tar -xzf "${ARCHIVE}" -C "${WORK}"
test -f "${WORK}/public/index.html"
test -f "${WORK}/dist/server.js"

rsync -a --delete "${WORK}/public/" "${BASE}/public_html/"
rsync -a --delete "${WORK}/public/" "${NODE_APP}/public/"
rsync -a --delete "${WORK}/dist/" "${NODE_APP}/dist/"
cp "${WORK}/server.cjs" "${WORK}/server.js" "${WORK}/package.json" "${NODE_APP}/"
cp "${BASE}/repos/NewsPulse-AI/scripts/hostinger-public.deepskyblue.htaccess" "${BASE}/public_html/.htaccess"

grep -q '^NODE_OPTIONS=' "${ENV}" || echo 'NODE_OPTIONS=--experimental-sqlite' >> "${ENV}"

REPO_DIR="${BASE}/repos/NewsPulse-AI"
if [ -d "${REPO_DIR}/.git" ]; then
  git -C "${REPO_DIR}" fetch origin main
  git -C "${REPO_DIR}" reset --hard origin/main
fi

cd "${NODE_APP}"
npm install --omit=dev
cp "${ENV}" "${NODE_APP}/.env"
chmod 600 "${ENV}" "${NODE_APP}/.env"
mkdir -p tmp
touch tmp/restart.txt
echo hostinger-bundle-ok
