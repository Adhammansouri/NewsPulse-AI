# Newsplus API

Node.js REST API (Fastify).

```bash
npm run dev -w newsplus-API
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Sign in with username/phone + password |
| POST | `/api/auth/forgot-password` | Request a password reset (always succeeds) |
| GET | `/api/auth/me` | Current user (Bearer token) |
| POST | `/api/auth/logout` | Invalidate client session (Bearer token) |

Dev seed user (override with `AUTH_SEED_*` env vars):

- identifier: `adham`
- password: `123456`
