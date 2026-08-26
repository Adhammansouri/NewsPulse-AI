# Newsplus

AI-powered news assistant for monitoring, summarisation, translation, and report writing.

## Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + Vite + TypeScript + Tailwind CSS 4 |
| **Backend** | Node.js + Fastify + TypeScript |
| **Shared** | `@newsplus/shared` — API types |
| **AI** | OpenAI API (to be connected) |

## Project Structure

```
newsplus-workspace/
├── newsplus-API/           # Backend (Fastify)
├── newsplus-front/         # Frontend (React/Vite)
├── packages/shared/        # Shared TypeScript types
├── design-system/          # Brand tokens & assets
└── docs/                   # Business docs & scripts
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

## Getting Started

```bash
npm install
cp newsplus-API/.env.example newsplus-API/.env
cp newsplus-front/.env.example newsplus-front/.env
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001/api/health |

## Scripts

```bash
npm run dev          # API + frontend
npm run dev:api      # Backend only
npm run dev:front    # Frontend only
npm run build        # Production build
npm run typecheck    # Type-check all packages
npm run install:all  # Install all workspaces
```

## Environment Variables

### API (`newsplus-API/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default: 3001) |
| `CORS_ORIGIN` | Frontend URL |
| `OPENAI_API_KEY` | OpenAI API key |

### Frontend (`newsplus-front/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API base (dev uses Vite proxy `/api`) |
| `VITE_APP_NAME` | App display name |

## Design System

See `design-system/newsplus-design-system.md`.

## Production

| | |
|---|---|
| **URL** | https://srv1930800.hstgr.cloud |
| **Login** | https://srv1930800.hstgr.cloud/login |
| **Deploy** | push to `main` → `.github/workflows/deploy-vps.yml` |

See [docs/VPS-DEPLOY.md](./docs/VPS-DEPLOY.md).
