# GLOBAL RULES — read before every sprint

These rules apply to **every** sprint. A sprint file never overrides them unless it says so explicitly.

## 1. Source of truth (in this order)

1. `docs/redesign/design/css/np4.css`, `npm2.css`, `npx.css` — exact colors, sizes, radii, shadows, motion. **Never invent a value.**
2. `docs/redesign/design/reference/<Board>.dc.html` — exact markup structure, class names, ARIA labels and **UI copy**.
3. `docs/redesign/design/screens/<Board>.jpg` — the visual result you must match (rendered at 1440×900 desktop, 390×844 mobile, with the real fonts).
4. The sprint file.

If two sources disagree, or something you need is not designed: **stop and ask**. Do not improvise a design.

### How to read a reference board
- Files are "design components": an HTML template + a `class Component extends DCLogic` whose `renderVals()` returns the data the template reads.
- `{{name}}` = a value from `renderVals()`. `<sc-if value="{{x}}">` = conditional block. `<sc-for list="{{rows}}" as="row">` = loop.
- A board like `MobWire-loading.dc.html` only contains `<dc-import name="MobWire" state="loading">`: it is the **same component** in another state. Open `MobWire.dc.html` and read the branch for that state.
- `docs/redesign/design/BOARD-INDEX.md` maps every board → sprint → base component → state.

## 2. UI copy vs. sample data
- **UI copy** (labels, buttons, headings, hints, errors, empty states, toasts, ARIA labels) → copy **verbatim** from the reference file. Egyptian/colloquial Arabic is intentional. Do not "correct" it to formal Arabic.
- **Sample data** (headlines, sources, names like «سارة», «أدهم», numbers like `$18.42`, `١٬٢٤٨`, times like «قبل ٣ دقائق») → placeholders. Bind to real API data. **Never ship sample data.**
- When a sentence mixes both (e.g. «جهّزت المنشور من ٣ مصادر»), keep the sentence and interpolate the real values.

## 3. Styling
- Port the design CSS **as-is** into `newsplus-front/src/styles/design/` (done in S01) and build components that emit the **same class names** (`btn btn--ai`, `wire-row is-now`, `tile`, `block`, `dock`, `m-tabbar`, …).
- Inline `style` only where the reference uses inline style. Data-driven colors (source marks, carousel art) come from data.
- No new colors, font sizes, radii, shadows, spacing values or animations. No Tailwind utilities for anything the design CSS already covers.
- Root element: `<div class="np" data-theme="light|dark">` (+ class `m` below 1024px, see §6).

## 4. Language, direction, numbers
- App is RTL (`dir="rtl"` on `<html>`). Use logical properties (`inset-inline-start`, `margin-inline-end`, …) — the design CSS already does.
- LTR islands: English text, URLs, handles, `$` amounts, model names, keyboard combos (`<span dir="ltr">`), exactly where the reference sets `dir="ltr"`.
- Arabic UI shows **Arabic-Indic digits** (٠١٢٣٤٥٦٧٨٩). Use `toArabicDigits()` from `src/utils/arabic.ts` (created in S01) for every number rendered inside Arabic copy.
- Count phrases follow Arabic grammar via `countPhrase(n, forms)` (S01): 1 → «مصدر واحد», 2 → «مصدرين», 3–10 → «٣ مصادر», 11+ → «١١ مصدر». Never render «٨ عنوان» or «2 مصادر».

## 5. Icons & fonts
- Icons: only `<Icon name="…">` backed by `docs/redesign/design/icons.json` (exact path data, stroke 1.75, round caps). Replace `@phosphor-icons/react` usages in every screen you touch; remove the dependency in S10.
- Fonts (self-hosted, S01): **Alexandria** 500/600/700 (display), **IBM Plex Sans Arabic** 400/500/600/700 (UI/body), **IBM Plex Sans** 400/600 (English text). No Google Fonts at runtime. Remove Doto, Space Grotesk, Space Mono, Geist, Noto.

## 6. Layout & breakpoints
- **≥ 1024px → desktop design** (`Desk*`, `Main*`, `New*` boards). Rail 88px · wire column 420px (`clamp(340px, 30vw, 420px)`) · studio fluid · editor aside 344px.
- **1024–1279px**: same desktop layout, but the editor aside collapses into the bottom revise dock (the mobile `dock` pattern) inside the studio. This is the only non-designed adaptation allowed.
- **< 1024px → mobile design** (`Mob*` boards). Root gets class `m`. In the app `.np.m` is **not** 390×844: S01 changes it to `width:100%; height:100dvh`.
- Safe areas: tab bar and bottom CTAs add `env(safe-area-inset-bottom)` to their bottom padding.

## 7. Behavior & logic
- Keep every existing API call, contract and business rule unless the sprint lists a change. Backend changes only in sprints that say "Backend".
- Keep TanStack Query; keep `services/*`. Shared types live in `packages/shared`.
- Every async surface needs the designed states: loading (skeleton shaped like the content — never a spinner), empty, error (with the designed recovery action), success.
- Respect `prefers-reduced-motion` (already in CSS — don't add JS animations that bypass it).

## 8. Accessibility (non-negotiable)
- ARIA labels exactly as in the reference (`aria-label`, `aria-pressed`, `aria-current`, `role="dialog"`, `aria-live` on AI progress).
- Mobile touch targets ≥ 44×44px (npm2.css enforces most of this — don't override it).
- Visible `:focus-visible` (in CSS). Dialogs/sheets trap focus and close on `Esc`; return focus to the trigger.

## 9. Definition of done (every sprint)
1. `npm run typecheck` and `npm run build` pass in `newsplus-front` (and `newsplus-API` if touched).
2. `npm test` passes.
3. Visual QA: run `node docs/redesign/qa-tools/shots.mjs <sprint>` (see `qa-tools/README.md`) and compare every generated shot with the matching `design/screens/*.jpg`, light **and** dark. List any difference in the PR description; fix before merging.
4. No sample data in production code. No `console.log`. No unused old CSS for the screens you rebuilt (delete it).
5. One PR per sprint, titled `redesign(Sxx): <name>`.
