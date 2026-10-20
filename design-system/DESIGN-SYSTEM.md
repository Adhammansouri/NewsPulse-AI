# Newsplus Design System

نظام تصميم واحد لكل الشاشات (بديل نظام Brand/Nothing المختلط القديم).
Single system, Arabic-first (RTL), light + dark, mobile + desktop.

## Principles

1. **Newsroom first** — the interface serves a journalist under deadline: one primary action per screen, state in the URL, nothing hidden behind hover.
2. **One signature** — the "live wire": a vertical headline timeline (`wire.css`) with a pulsing live dot. Everything else stays quiet.
3. **Space is information** — dense on desktop (split panes), single-column and thumb-reachable on mobile (bottom tab bar, bottom sheets).
4. **Motion confirms actions** — sliding segmented thumb, drawn check on copy, sheet slide, skeleton → content. No decorative entrance animation. `prefers-reduced-motion` disables all of it.

## Files

| File | Role |
|------|------|
| `design-system/tokens.css` | Colors, type, space, radius, motion, layout, z-index. Dark values under `html[data-theme="dark"]`. |
| `newsplus-front/src/styles/base.css` | Reset, typography, focus ring, `.sr-only`. |
| `styles/motion.css` | Keyframes (`np-*`) and reduced-motion override. |
| `styles/components.css` | Buttons, fields, segmented, chips, badges, panel, notice, empty, skeleton, sheet, toast, working state. |
| `styles/shell.css` | App shell: sidebar, mobile bar, tab bar, "More" sheet. |
| `styles/wire.css` | Headline timeline rows. |
| `styles/workspace.css` | Shared two-pane layout (`.ws*`) for Generate/Translate and the `.doc*` article preview. |
| `modules/News/newsroom.css`, `modules/Usage/usage.css`, `modules/Home/home.css`, `modules/Login/login.css`, `modules/Notifications/notifications.css` | Per-screen styles only. |

## Tokens (summary)

- **Color**: navy ink (`--ink` #0c2340) on cool paper (`--bg` #f3f5f8); brand teal (`--brand`), live coral (`--live`), plus `--ok/--warn/--danger/--info`. Dark theme: deep navy surfaces, lighter teal.
- **Type**: Readex Pro (display) · IBM Plex Sans Arabic (body) · IBM Plex Sans (Latin). Scale `--t-xs … --t-3xl`; Arabic body line-height `1.8`. Western digits everywhere (`formatNumber`).
- **Space**: 4px base (`--s-1 … --s-16`). **Radius**: 8 / 12 / 16 / 22 / pill.
- **Motion**: `--dur-1..4` = 110 / 190 / 300 / 520 ms; `--ease-out`, `--ease-in-out`, `--ease-spring`.
- **Layout**: sidebar 15.5rem (4.75rem collapsed), top bar 3.5rem, tab bar 4rem, content max 82rem, control height 2.75rem (touch-safe).
- Use **logical properties** (`margin-inline`, `inset-inline-start`, …) so RTL/LTR both work. Mixed-direction text goes in `<bdi>` / `dir="auto"`.

## Shell & navigation

- **Desktop (≥1024px)**: collapsible sidebar (right edge in RTL), theme toggle, logout.
- **Mobile**: slim top bar + 5-tab bottom bar (الرئيسية · الأخبار · التوليد · الترجمة · المزيد). "المزيد" opens a sheet with usage, notifications, theme, logout.

## Components (`components/ui`)

`Segmented` (radiogroup + sliding thumb) · `Sheet` (native `<dialog>`; `bottom` / `center` / `side`) · `toast()` + `Toaster` · `CopyButton` · `Notice` (info/warn/error) · `EmptyState` · `QuotaNotice`. Prefer these over ad-hoc markup.

## Newsroom pattern

- State is URL-driven: `?item=` (open story) and `?c=` (open conversation). Back button closes the story on mobile.
- Desktop: feed (wire) + story panel side by side. Mobile: feed, story opens as a full-screen overlay (`inert` background).
- The open story is snapshotted so it stays readable even if a refresh removes it from the feed (cluster IDs are unstable).
- Filters: inline on desktop, a sheet on mobile. Search is debounced (350ms).

## Workspace pattern (`.ws*`)

Generate and Translate share one layout: header with tools, tabs (mobile only: source ⇄ output), two panes on desktop, sticky action dock at the bottom. `Ctrl/⌘+Enter` submits.

## Rules

- No new colors or radii outside tokens. No hardcoded `left/right`.
- Every interactive element: visible focus (`--focus`), ≥44px hit area on touch.
- Loading → skeleton or `.working`; empty → `EmptyState` with the next action; errors → `Notice` that says what to do.
- Test at 360px, 768px, 1280px, light + dark, RTL.
