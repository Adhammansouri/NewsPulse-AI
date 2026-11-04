# S01 · الأساس: الـ Design System والخطوط والمكوّنات

> **الهدف:** نحط نظام «Pulse» في الكود (الألوان، والخطوط، والأيقونات، وكل المكوّنات الصغيرة) من غير ما نغيّر أي شاشة لسه. كل السبرينتات اللي بعده بتعتمد عليه.

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S01-foundation.md exactly.
Reference boards: DesignSystem, Motion (docs/redesign/design/screens/ + design/reference/).
Do not change any existing screen in this sprint. Stop and ask if anything is ambiguous.
```

## Boards
`DesignSystem` · `Motion` — open both `.jpg` and `.dc.html`.

## 1. Fonts (self-hosted)
- `npm i -w newsplus-front @fontsource/alexandria @fontsource/ibm-plex-sans-arabic @fontsource/ibm-plex-sans`
- In `src/main.tsx` import only: Alexandria `500,600,700`; IBM Plex Sans Arabic `400,500,600,700`; IBM Plex Sans `400,600`.
- Remove every Google Fonts `<link>`/`@import` from `index.html` and CSS, and every reference to Doto, Space Grotesk, Space Mono, Geist, Noto.

## 2. Design CSS
- Copy `docs/redesign/design/css/np4.css`, `npm2.css`, `npx.css` to `newsplus-front/src/styles/design/` **unchanged**, except this single edit in `npm2.css`:
  - `.np.m{position:relative;width:390px;height:844px;…}` → `.np.m{position:relative;width:100%;height:100dvh;display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}`
- Create `src/styles/app.css`: imports the three files in order (np4 → npm2 → npx), plus `html,body{margin:0}` and `body{background:var(--bg)}` resolved from the root.
- `src/index.css`: keep the Tailwind import for now, then `@import "./styles/app.css";`. **Do not delete the old CSS yet** — each later sprint deletes the old CSS of the screens it rebuilds; S10 deletes the rest.

## 3. Root, theme, breakpoint
- `src/hooks/useIsMobile.ts`: `matchMedia("(max-width: 1023.98px)")`, SSR-safe, updates on change.
- `src/components/layouts/AppRoot.tsx`: renders `<div className={"np" + (isMobile ? " m" : "")} data-theme={theme}>` around the router outlet. Theme comes from the existing `useTheme` / `themeStore` (key `newsplus-theme`). Keep the existing toggle logic.
- `src/ui/AiGradientDefs.tsx`: the hidden `<svg>` with `<linearGradient id="np-ai-grad">` exactly as in the reference (light stops `#0d9b8a → #0ea5e9`, dark `#2dd4bf → #38bdf8`). Render once inside `AppRoot`.

## 4. Utilities — `src/utils/arabic.ts`
```ts
export function toArabicDigits(v: number | string): string            // 0-9 → ٠-٩, keeps separators
export function countPhrase(n: number, f: { one: string; two: string; few: string; many: string }): string
// one: "مصدر واحد" · two: "مصدرين" · few (3–10): "{n} مصادر" · many (11+): "{n} مصدر"  ({n} rendered with toArabicDigits)
export function relativeTimeAr(iso: string, now?: Date): string        // «الآن» «قبل دقيقة» «قبل ٣ دقائق» «قبل ١١ دقيقة» «قبل ساعة» «قبل ساعتين» «قبل ٣ ساعات» «أمس ٨:١٠ م»
```
Unit-test these three (add to `npm test`).

## 5. Icons — `src/ui/Icon.tsx`
- Generate `src/ui/icons.ts` from `docs/redesign/design/icons.json` (name → path `d`).
- `<Icon name size="sm|md|lg|xl" className />` renders `<svg class="ic ic--sm" viewBox="0 0 24 24" aria-hidden="true"><path d=…/></svg>`. Prop `ai` sets `style={{ stroke: "url(#np-ai-grad)" }}`. `more` uses stroke-width 3.

## 6. UI kit — `src/ui/` (one file each, class names exactly as in np4/npx)
| Component | Classes / notes |
|---|---|
| `Button` | `btn` + variant `--ai --ink --quiet --ghost --danger`, size `--sm --lg`, `--block`; `loading` shows `PulseLine` (small) and disables; optional `kbd` renders `<span class="kbd">` |
| `IconButton` | `icon-btn`, `--line`; **requires** `label` → `aria-label` |
| `Field` | `field` (+ `--sunken`, `--area`, `is-focus`, `is-valid`, `is-error`); `hint` → `hint hint--error / --ok` |
| `Segmented` | `seg` (+ `seg--block`), buttons with `aria-pressed` |
| `Chip` | `chip` (+ `--sm --ai --soft`), `aria-pressed`, optional count `<span class="n num">` |
| `Badge` | `badge--breaking --teal --warn --ok --ai --topic --count` |
| `SourceMarks` | `marks` + `mark` (letter + color from data) |
| `Switch` / `Check` | `switch` (`role="switch"`, `aria-checked`), `check` + `is-on` |
| `Notice` | `notice--error --warn --info --ok` (icon + text span — **text must be wrapped in one `<span>`**) |
| `EmptyState` | `empty`, `empty__art` |
| `Skeleton` | `sk` (width/height/radius props) |
| `Panel` / `AiPanel` | `panel`, `ai-panel`, optional `ai-strip`, `ai-glow` |
| `Sheet` / `Drawer` / `Popover` / `Dialog` | `scrim` + `sheet` (grabber) / `drawer` / `popover` / `m-dialog`; focus trap, `Esc` closes, return focus |
| `Toast` + `useToast()` | `toast`; one at a time, 1.9s, optional «تراجع» action; mobile position `m-toast` |
| `PulseLine` | the exact SVG paths from the reference (`pulse-line`, base + animated path) |
| `AiSteps` | `steps` / `step is-done / is-active` |
| `Meter`, `Ring` | `meter`, `ring` (`--p`, `--c`) |
| `VersionChip`, `Key` | `vchip` (`aria-current`), `key` |

Copy prop names from the reference where possible. Every component forwards `className` and native props.

## 7. Dev-only gallery
Route `/__design` (only when `import.meta.env.DEV`) rendering every UI-kit component in the same groups and order as the `DesignSystem` board, plus a theme toggle. This is the QA target for this sprint.

## Acceptance
- [ ] `/__design` matches `DesignSystem.jpg` section by section (light and dark).
- [ ] Motion matches `Motion` board: typeset reveal, new-headline drop, format pick pop, sheet spring; all disabled with reduced motion.
- [ ] No Google Fonts request in the network tab; Arabic renders in IBM Plex Sans Arabic, headings in Alexandria.
- [ ] Existing screens still work (visually unchanged except fonts).
- [ ] Unit tests for `arabic.ts` pass; typecheck/build pass.

## Out of scope
Any screen redesign. Removing old CSS.
