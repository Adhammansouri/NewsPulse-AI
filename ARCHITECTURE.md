# Architecture

Monorepo for **Newsplus**: two workspace packages at root + shared types.

## Workspace Layout

```
newsplus-workspace/
├── newsplus-API/               # Backend
├── newsplus-front/             # Frontend
├── packages/shared/            # Shared types
├── design-system/
└── docs/
    ├── business/
    └── scripts/
```

## Frontend (`newsplus-front`)

```
src/
├── main.tsx
├── App.tsx
├── index.css
├── routes/
├── components/
│   ├── layouts/
│   └── shared/
├── modules/
├── services/
├── hooks/
├── types/
└── utils/
```

## Backend (`newsplus-API`)

```
src/
├── index.ts
├── app.ts
├── server.ts
├── config/
├── routes/
├── controllers/
├── services/
├── middleware/
├── model/
├── plugins/
└── utils/
```

## API Response Shape

```json
{
  "status": "success",
  "data": { ... }
}
```

## Shared Package

`@newsplus/shared` — types used by frontend services and API controllers.
