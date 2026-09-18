# Newsplus Hybrid Design System

Official split: **Newsplus brand** for marketing shell, **Nothing** for tool/dashboard surfaces.

## When to use which

| Surface | Theme | Tokens | Components |
|---------|-------|--------|------------|
| Header, Footer | Newsplus brand | `design-system/tokens.css` (`--header-*`) | `BrandMark`, `brand-header-*` |
| Home `/` | Newsplus brand desk (after login) | `--color-navy-*`, `--color-teal-*` | `components/brand/desk/*` |
| Notifications `/notifications` | Newsplus brand settings | semantic + `--header-*` | `modules/Notifications/*` |
| Login `/login` | Newsplus brand (full-bleed, no Header/Footer) | navy/teal login tokens in `modules/Login/login.css` | `LoginPage` |
| Tools `/news`, `/generate`, `/translate` | Nothing dashboard | `--nd-*` in `.theme-tools` | `ToolPage`, `nd-*` classes |

## Implementation

- **Global theme:** `html[data-theme="light|dark"]` via `themeStore` (`newsplus-theme` in localStorage). Light is default; manual toggle only (no system preference).
- **Route switch:** `MainLayout` adds `theme-tools` on tool routes. Tool surfaces follow the global theme: Nothing **light** (off-white paper) or **OLED dark**.
- **Fonts:** IBM Plex Sans + IBM Plex Sans Arabic (brand) · Space Grotesk + Space Mono + Doto (tools).
- **Skills:** Taste Skill (global anti-slop) · Nothing skill (tools only) · Newsplus brand docs (marketing).

## Brand rules (marketing)

- Navy `#0C2340`, Teal `#0D9B8A`, Coral/Cyan semantic only
- Original logo PNGs (`/icons/logo-icon.png`, `/logo-horizontal.png`)
- Light editorial UI — Home after login is the newsroom desk (live headlines + compose), still brand tokens; no 3 equal feature cards
- Dark mode: semantic tokens in `tokens.css` (`--bg-primary`, `--text-primary`, etc.) — not color inversion
- See `newsplus-design-system.md` and `DESIGN.md`

## Nothing rules (tools)

- Monochrome, flat surfaces, no shadows
- **Light:** off-white `#F5F5F5` page, white cards, black ink
- **Dark:** OLED `#000000`, white data on black
- Space Mono labels (ALL CAPS), segmented bars for status
- Inline status: `[ PENDING ]`, `[ ERROR ]` — no toast, no skeleton shimmer
- See `.cursor/skills/nothing-design/`

## Do not mix

- No teal buttons inside `.theme-tools` (use `nd-btn-primary` pill)
- No Nothing mono caps labels on Home marketing sections
- Header/Footer always Newsplus — never Nothing chrome

## Files

```
newsplus-front/src/
  components/brand/     # Home desk + marketing pieces
  components/shared/    # Shell (Header, Footer, ToolPage, BrandMark, ThemeToggle)
  services/themeStore.ts
  hooks/useTheme.ts
  index.css             # Both token sets + utility classes
design-system/
  tokens.css            # Newsplus CSS variables
  newsplus-design-system.md
  DESIGN.md             # Stitch / marketing semantic export
  HYBRID.md             # This file
```
