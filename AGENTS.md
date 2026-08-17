# Newsplus Workspace

Monorepo: `newsplus-API` + `newsplus-front`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [README.md](./README.md).

## Frontend design (hybrid)

Official design system: **[design-system/HYBRID.md](./design-system/HYBRID.md)**

| Layer | Style | Where |
|-------|-------|-------|
| **Brand / marketing** | Newsplus navy/teal + Taste Skill | Home, Header, Footer, `/login` |
| **Tools / dashboard** | [Nothing Design](https://github.com/dominikmartn/nothing-design-skill) | `/news`, `/generate`, `/translate` |

- **Theme:** global light/dark via `html[data-theme]` — `newsplus-front/src/services/themeStore.ts`, toggle in Header + Login
- Newsplus tokens: `design-system/tokens.css`, `newsplus-design-system.md`
- Brand components: `newsplus-front/src/components/brand/`
- Nothing skill: `.cursor/skills/nothing-design/SKILL.md` (tools only)
- Taste Skill: `.cursor/skills/design-taste-frontend/SKILL.md` (global anti-slop)
