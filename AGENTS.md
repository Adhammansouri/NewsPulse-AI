# Newsplus Workspace

Monorepo: `newsplus-API` + `newsplus-front`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [README.md](./README.md).

## Frontend design

Official design system: **[design-system/DESIGN-SYSTEM.md](./design-system/DESIGN-SYSTEM.md)** — one unified system (Arabic-first RTL, light/dark, mobile + desktop).

- Tokens: `design-system/tokens.css`; shared styles in `newsplus-front/src/styles/`
- UI primitives: `newsplus-front/src/components/ui/` (Segmented, Sheet, toast, CopyButton, Notice, EmptyState)
- App shell: `newsplus-front/src/components/shell/`
- Theme: `html[data-theme]` via `newsplus-front/src/services/themeStore.ts`
- Use logical CSS properties; no hardcoded colors/radii outside tokens.
