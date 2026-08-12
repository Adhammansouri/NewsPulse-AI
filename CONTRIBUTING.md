# Contributing

## Setup

```bash
npm install
cp newsplus-API/.env.example newsplus-API/.env
cp newsplus-front/.env.example newsplus-front/.env
npm run dev
```

## Conventions

### Frontend

| Pattern | Location |
|---------|----------|
| Feature screens | `modules/<Feature>/pages/` |
| Shared UI | `components/shared/` |
| API calls | `services/<name>Service.ts` |
| URL registry | `services/urls.ts` |
| Hooks | `hooks/use<Name>.ts` |

### Backend

| Pattern | Location |
|---------|----------|
| Routes | `routes/<name>Routes.ts` |
| Handlers | `controllers/<name>Controller.ts` |
| Business logic | `services/` |

## Adding a Feature

1. **API:** `routes/` → `controllers/` → `services/`
2. **Front:** `modules/<Feature>/pages/` + `services/` + `hooks/`
3. **Types:** `packages/shared/src/types/`
4. **Routes:** register in `newsplus-front/src/routes/index.tsx`
