# Newsplus Workspace

Monorepo: `newsplus-API` + `newsplus-front`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [README.md](./README.md).

## Frontend design (Pulse)

Single source of truth: **[docs/redesign/](./docs/redesign/README.md)**. Read [GLOBAL-RULES.md](./docs/redesign/GLOBAL-RULES.md) before any UI work and match `docs/redesign/design/screens` exactly; never invent design.

- CSS: `newsplus-front/src/styles/design/` (np4 / npm2 / npx, ported as-is from `docs/redesign/design/css`). No Tailwind.
- UI kit: `newsplus-front/src/ui/` (class names follow the design CSS).
- **Theme:** global light/dark via `html[data-theme]` — `newsplus-front/src/services/themeStore.ts`.
- Visual QA: `node docs/redesign/qa-tools/shots.mjs <sprint|all>` against `docs/redesign/design/screens`.
- The old hybrid system (`design-system/HYBRID.md`, Nothing tools, `brand-*` / `nd-*`) is superseded.
