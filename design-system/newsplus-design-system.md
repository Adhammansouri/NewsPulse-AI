# NewsPlus Design System

Professional visual identity for **NewsPlus** — AI-powered news monitoring, summarisation, translation & report writing.

---

## Brand Essence

| Attribute | Expression |
|-----------|------------|
| Trust | Deep editorial navy — authority without coldness |
| Intelligence | Teal pulse accent — AI, speed, real-time |
| Clarity | High-contrast neutrals — readable news content |
| Alert | Coral accent — breaking news, notifications |

---

## Color Palette

### Primary

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `navy-900` | `#0C2340` | 12, 35, 64 | Logo **N**, headers, primary buttons |
| `navy-700` | `#1A3A5C` | 26, 58, 92 | Secondary surfaces, dark UI cards |
| `navy-500` | `#2E5078` | 46, 80, 120 | Borders on dark, muted icons |

### Accent — Pulse Teal

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `teal-600` | `#0D9B8A` | 13, 155, 138 | Logo **P**, primary links, CTAs |
| `teal-500` | `#14B8A6` | 20, 184, 166 | Hover states, active tabs |
| `teal-400` | `#2DD4BF` | 45, 212, 191 | Highlights, AI feature badges |

### Accent — Intelligence Cyan

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `cyan-500` | `#0EA5E9` | 14, 165, 233 | AI summaries, tech labels |
| `cyan-400` | `#38BDF8` | 56, 189, 248 | Glow effects, dark mode accents |

### Accent — Alert Coral

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `coral-500` | `#EF6C57` | 239, 108, 87 | Notification dot, breaking news |
| `coral-400` | `#F4845F` | 244, 132, 95 | Hover on alerts |

### Neutrals

| Token | Hex | Usage |
|-------|-----|-------|
| `slate-900` | `#0F172A` | Dark mode background |
| `slate-800` | `#1E293B` | Dark mode cards |
| `slate-600` | `#475569` | Secondary text |
| `slate-400` | `#94A3B8` | Placeholders, disabled |
| `slate-200` | `#E2E8F0` | Borders, dividers |
| `slate-50` | `#F8FAFC` | Light mode background |
| `white` | `#FFFFFF` | Surfaces, logo plus sign |

### Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#10B981` | Published, synced |
| `warning` | `#F59E0B` | Pending review |
| `error` | `#EF4444` | Errors, failed sync |
| `info` | `#0EA5E9` | Tips, AI hints |

---

## Logo Color Application

```
N letter     → navy-900  (#0C2340)
P letter     → teal-600  (#0D9B8A)
Plus (+)     → white     (#FFFFFF)
Notification → coral-500 (#EF6C57)
Overlap shadow → navy-900 at 30% opacity
```

### Dark Mode

```
Background   → slate-900 (#0F172A)
N letter     → white     (#FFFFFF) or slate-50
P letter     → teal-400  (#2DD4BF)
Plus (+)     → slate-900 (#0F172A) or navy-900
Notification → coral-400 (#F4845F)
```

---

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | Inter | 700 | 32–48px |
| Heading | Inter | 600 | 20–28px |
| Body | Inter | 400 | 14–16px |
| Caption | Inter | 500 | 12px |
| Arabic body | Noto Sans Arabic | 400 | 14–16px |
| Logo wordmark | Inter | 700 | — |

**Logo wordmark rule:** `News` in `navy-900`, `Plus` in `teal-600`, same bold rounded sans-serif.

---

## Spacing Scale

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` (px)

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 6px | Buttons, inputs |
| `md` | 12px | Cards |
| `lg` | 16px | Modals |
| `full` | 9999px | Avatars, pills |

---

## Shadows

| Token | Value |
|-------|-------|
| `sm` | `0 1px 2px rgba(12, 35, 64, 0.06)` |
| `md` | `0 4px 12px rgba(12, 35, 64, 0.10)` |
| `lg` | `0 8px 24px rgba(12, 35, 64, 0.14)` |

---

## Logo (Approved)

| File | Use |
|------|-----|
| `assets/logo-horizontal.png` | Primary — website header, docs, presentations |
| `assets/logo-icon.png` | Icon only — app, favicon, Telegram avatar |

---

## CSS Variables

See `tokens.css` for implementation.

---

## Telegram Bot

- Avatar: `assets/logo-icon.png`
- Primary button color: `teal-600`
- Link color: `cyan-500`

## Web Interface

- Header bg: `white` / dark: `slate-900`
- Accent: `teal-600`
- Breaking news badge: `coral-500`
- AI summary label: `cyan-500`
