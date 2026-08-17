# Hostinger — deepskyblue-ibis-463603.hostingersite.com

Production URL: **https://deepskyblue-ibis-463603.hostingersite.com**

## Why 503 after deploy?

A **503** on this setup almost always means **Passenger could not start the Node app** (crash on boot), not a frontend routing issue.

Common causes:

1. **`JWT_SECRET` missing** while `NODE_ENV=production` — fixed in `newsplus-API/server.cjs` (auto-generates if absent).
2. **`dist/server.js` missing** — Hostinger Git build must run `npm run build` in `newsplus-API`.
3. **Frontend not synced into `public/`** — run the post-deploy cron (below).

## hPanel Node.js app settings

| Setting | Value |
|---------|--------|
| Root directory | `newsplus-API` |
| Entry file | `server.cjs` (or `server.js` — delegates to `server.cjs`) |
| Build command | `build` |
| Node.js | 20 |

## Environment file (recommended)

Path on server: `/home/u358087675/domains/deepskyblue-ibis-463603.hostingersite.com/hbuilds/config/.env`

```env
NODE_ENV=production
HOST=0.0.0.0
CORS_ORIGIN=https://deepskyblue-ibis-463603.hostingersite.com
JWT_SECRET=<openssl rand -hex 32>
```

`server.cjs` copies this file into the running app as `.env` on each start.

## Post-deploy cron (required for SPA assets)

Hostinger Git deploy only builds the API workspace. The React app must be built separately and copied into:

- `public_html/` (static fallback)
- `hbuilds/current/nodejs/public/` (served by Fastify when Passenger runs Node)

Cron command (every 5 minutes or after deploy):

```bash
bash /home/u358087675/domains/deepskyblue-ibis-463603.hostingersite.com/repos/NewsPulse-AI/scripts/hostinger-post-deploy.sh
```

Logs: `~/domains/deepskyblue-ibis-463603.hostingersite.com/logs/post-deploy.log`

## Quick recovery

1. hPanel → Websites → Node.js → **Restart** application.
2. Run the post-deploy script over SSH.
3. Check runtime logs in hPanel → Node.js → **Runtime logs**.

## Health check

When the API is up:

```text
GET https://deepskyblue-ibis-463603.hostingersite.com/api/health
```
