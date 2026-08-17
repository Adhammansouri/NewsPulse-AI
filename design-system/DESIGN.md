# Design System: Newsplus

## 1. Visual Theme & Atmosphere

A **trust-first editorial product interface** for Arabic-first journalists, editors, and analysts. The atmosphere reads like a modern newsroom desk — authoritative navy depth, crisp neutrals, and a single confident teal pulse for action — never the generic purple-on-dark AI aesthetic.

**Density:** Daily App Balanced (5–6). Tool screens carry real content (headlines, forms, status); home/marketing sections breathe with gallery-airy whitespace (3–4).

**Variance:** Offset Asymmetric (7) on home and hero moments; Predictable Symmetric (4–5) inside News, Translate, and Generate workflows where clarity wins.

**Motion:** Fluid CSS (5–6). Spring-weighted micro-interactions on CTAs and list reveals; no cinematic scroll hijacking on data-heavy screens. Perpetual loops only on live-status indicators (sync pulse, breaking badge).

**RTL default:** Arabic is the primary reading direction. Layouts mirror cleanly — navigation, asymmetric heroes, and form labels align to the right edge. English strings remain legible without breaking hierarchy.

**Product scope:** Multi-tool app (news monitoring, summarisation, translation, report generation) — not a single landing page. Marketing hero discipline applies to Home; tool pages prioritise scanability and editorial density.

---

## 2. Color Palette & Roles

Stick to **one cool neutral family** (slate) plus **editorial navy** surfaces. **Pulse Teal** is the sole decorative accent for CTAs and primary actions (saturation controlled, no neon). Coral and cyan are **functional semantic** colors only — never decorative gradients.

### Light mode

- **Newsroom Canvas** (`#F8FAFC`) — Primary page background (`slate-50`)
- **Editorial Surface** (`#FFFFFF`) — Cards, panels, modals, input fields
- **Authority Ink** (`#0C2340`) — Primary text, wordmark “News”, headers (`navy-900`). Never pure black
- **Deck Navy** (`#1A3A5C`) — Secondary surfaces, dark UI cards, dark-mode borders (`navy-700`)
- **Muted Wire** (`#475569`) — Secondary text, metadata, captions (`slate-600`)
- **Whisper Line** (`#E2E8F0`) — Dividers, card borders, dashed status zones (`slate-200`)
- **Pulse Teal** (`#0D9B8A`) — **Single primary accent** — primary buttons, active nav, logo “plus”, links on hover (`teal-600`, saturation ~72%)
- **Pulse Teal Hover** (`#14B8A6`) — Hover states, active tabs (`teal-500`)
- **Pulse Teal Highlight** (`#2DD4BF`) — AI badges, dark-mode accent lift (`teal-400`)

### Semantic (functional only — not decorative accents)

- **Intelligence Cyan** (`#0EA5E9`) — AI summary labels, tech hints, info states (`cyan-500`)
- **Breaking Coral** (`#EF6C57`) — Breaking news badges, notification dot, connection errors (`coral-500`)
- **Published Green** (`#10B981`) — Success, synced, published (`success`)
- **Review Amber** (`#F59E0B`) — Pending review, warnings (`warning`)
- **Fault Red** (`#EF4444`) — Form errors, failed sync (`error`)

### Dark mode

- **Night Desk** (`#0F172A`) — Primary background (`slate-900`)
- **Panel Slate** (`#1E293B`) — Elevated surfaces (`slate-800`)
- **Frost Text** (`#F8FAFC`) — Primary text on dark
- **Pulse Teal Lift** (`#2DD4BF`) — Primary accent on dark (`teal-400`)
- **Breaking Coral Soft** (`#F4845F`) — Alerts on dark (`coral-400`)

**Banned:** `#000000` pure black, purple/violet gradients, neon outer glows, oversaturated accent stacks, warm/cool gray mixing in one screen.

---

## 3. Typography Rules

### Stacks

- **Display / Headlines:** `Geist` — Track-tight (`-0.02em`), weight-driven hierarchy (600–700). Controlled scale via `clamp()`, not oversized shouting
- **Body:** `Geist` — Relaxed leading (1.6–1.75), max **65 characters** per line in prose blocks
- **Arabic Body / UI:** `Noto Sans Arabic` — Primary for RTL interface text, 14–16px body, 400–600 weights
- **Mono:** `Geist Mono` — Timestamps, API version strings, source IDs, numeric metadata in high-density rows

**Pairing rule:** `Noto Sans Arabic` + `Geist` for bilingual UI. Sans-serif only — no serif in dashboards or software screens.

### Scale (reference)

| Role | Size | Weight | Notes |
|------|------|--------|-------|
| Display | `clamp(1.75rem, 4vw, 3rem)` | 700 | Hero headlines only |
| Heading | 20–28px | 600 | Section titles |
| Body | 14–16px | 400 | Minimum 14px / 1rem |
| Caption | 12px | 500 | Badges, helper text |

### Wordmark

`News` in Authority Ink (`#0C2340`), `plus` in Pulse Teal (`#0D9B8A`), bold rounded sans — reads as **Newsplus**.

### Banned

- `Inter` (legacy token — do not use in new Stitch screens)
- Generic serifs (`Times New Roman`, `Georgia`, `Garamond`, `Palatino`)
- Gradient text on large headers
- `LABEL // YEAR` eyebrow formatting

---

## 4. Component Stylings

### Buttons

- **Primary:** Pulse Teal fill (`#0D9B8A`), white label, 6px radius (`radius-sm`), no outer glow
- **Active:** Tactile push — `translateY(1px)` scale `0.98`, no custom cursor
- **Ghost:** Transparent with Whisper Line border; hover fills `teal-600/10`
- **One primary CTA per hero** — no secondary “Learn more” link beside it
- **Touch target:** Minimum 44px height on mobile

### Cards & panels

- **Radius:** 12px (`radius-md`) for cards; 16px (`radius-lg`) for hero panels
- **Shadow:** Tinted to navy — `0 4px 12px rgba(12, 35, 64, 0.10)` (`shadow-md`)
- **Use cards only when elevation signals hierarchy** — on dense tool lists, prefer border-top dividers or negative space
- **Feature grid:** Never three equal columns at desktop — use 2-column zig-zag, asymmetric grid, or horizontal scroll strip

### Badges & pills

- **AI feature:** Intelligence Cyan text on `cyan-500/10` background
- **Breaking:** Breaking Coral dot + label on `coral-500/10`
- **Monitor / status:** Pulse Teal on `teal-600/10`
- Rounded full (`radius-full`), 12px caption weight 500

### Inputs & forms

- Label **above** input (RTL: label aligns right)
- Helper text optional below; error text in Fault Red below field
- Focus ring: 2px Pulse Teal, no floating labels
- Standard vertical gap: 8px label-to-input, 16px between fields

### Navigation

- **Desktop:** Single horizontal row, max 80px header height, one line of links
- **Mobile:** Clean collapse to menu; no decorative status dots
- **Active state:** Pulse Teal text or underline — not pill on every item

### Loaders

- Skeletal shimmer matching exact layout dimensions (headline bars, card blocks)
- No generic circular spinners as the only loading state

### Empty states

- Composed illustration zone + one clear action — not lone “No data” text

### Error states

- Inline, contextual — e.g. coral connection message in status panel (real API state only)

### Status panel (system health)

- Dashed Whisper Line border, Newsroom Canvas fill
- Show only **real** API fields: `status`, `version`, `openai` connected flag
- Never invent uptime percentages, response times, or SLA metrics

---

## 5. Layout Principles

- **Max width:** 1152px (`max-w-6xl`) centered with responsive padding `16px → 24px → 32px`
- **Grid-first:** CSS Grid for feature and content layouts — no `calc()` percentage flex hacks
- **Hero (Home):** Asymmetric split — text block + logo/visual in separate zones. **No centered hero** when variance > 4. RTL: text block leads from the right
- **Inline image typography (marketing only):** Small contextual photos inline at type-height between headline words — rounded, no overlap with text; stack below headline on mobile
- **Section gaps:** `clamp(3rem, 8vw, 6rem)` vertical rhythm
- **Full viewport sections:** `min-h-[100dvh]` — never `h-screen`
- **No overlapping elements** — each block owns its spatial zone; no absolute-positioned text over images
- **Tool pages:** Single-column form + results split on large screens; collapse to single column below 768px

### Responsive rules

- **< 768px:** All multi-column layouts → single column. **No horizontal scroll**
- **Typography:** Headlines via `clamp()`; body never below 14px
- **Touch:** 44px minimum interactive targets
- **Images:** Inline hero images stack below headline on mobile

### App surfaces to generate

| Screen | Intent |
|--------|--------|
| Home | Asymmetric hero, asymmetric feature entry (not 3 equal cards) |
| News | Headline list, source tags, summary cards, breaking badge |
| Generate | Topic/link input, style controls, generated article preview |
| Translate | Source/target columns, bilingual text areas, swap control |
| Login `/login` | Split atmosphere + floating form card. Brand lockup on the start half, form on the end half. Light/dark + AR/EN chrome. No Header/Footer. |

### Login screen (auth)

- **Layout:** X-PAY split shell — full-bleed navy/teal cloud atmosphere, logo lockup on the brand half, form card on the opposite half. Mobile stacks lockup above the card.
- **Identity:** Authority Ink + Pulse Teal only. Original `logo-icon.png`. Wordmark is `News` + `plus`, never X-PAY emerald.
- **Type:** Geist + Noto Sans Arabic. Arabic titles: `letter-spacing: normal`, line-height ≥ 1.3. Logical CSS (`inset-inline`, `text-align: start`).
- **Chrome:** Pill toolbar (theme + language). Theme uses View Transitions when available. Language crossfades the form wrap.
- **Form:** Label above input. Password eye toggle. Remember me + forgot password. Inline error/success. Submit states: idle / loading / success.
- **Motion:** Fluid CSS (5). Honor `prefers-reduced-motion`. No WebGL canvas, no neon glow.
- **Dials:** Variance 6, Motion 5, Density 4.

---

## 6. Motion & Interaction

- **Spring default:** `stiffness: 100`, `damping: 20` — weighty, editorial, not bouncy toy UI
- **Easing:** No linear easing on interactive elements
- **List reveals:** Staggered cascade (40–60ms per item) for headline feeds — never instant full mount
- **Perpetual micro-loops (limited):** Soft pulse on live/sync indicator and breaking badge only
- **Performance:** Animate `transform` and `opacity` only — never `top`, `left`, `width`, `height`
- **Reduced motion:** Respect `prefers-reduced-motion` — disable stagger and loops
- **Scroll:** No raw `window` scroll listeners; no scroll-jacking on tool pages

---

## 7. Anti-Patterns (Banned)

### Visual

- Emojis anywhere in UI chrome
- `Inter` font
- Pure black (`#000000`)
- Purple/blue neon gradients, AI-purple mesh heroes, glassmorphism on everything
- Neon outer glow shadows on buttons
- Oversaturated accents or multiple competing accent colors per screen
- Centered hero on high-variance marketing sections
- Three equal feature cards in a row
- Overlapping text and images
- `border-t` + `border-b` on every row in long lists
- Decorative pills on images, version footers, locale/time strips, scroll chevrons
- Custom mouse cursors
- Div-based fake product UI mockups inside marketing sections

### Copy & data

- AI clichés: “Elevate”, “Seamless”, “Unleash”, “Next-Gen”, “Revolutionize”
- Filler UI: “Scroll to explore”, “Swipe down”, bouncing arrows
- Generic names: “John Doe”, “Acme”, “Nexus”
- Fake round numbers: `99.99%`, `50%` improvement
- **Fabricated metrics** — no invented uptime, response times, deploy counts, or “BY THE NUMBERS” dashboard cards
- Use `[metric]` placeholders if real data is unavailable
- `SYSTEM // 2024` eyebrow formatting

### Assets

- Broken Unsplash URLs — use `picsum.photos` or simple SVG placeholders
- Hand-rolled SVG icons — use Phosphor, HugeIcons, Radix, or Tabler sets

### Technical

- `h-screen` for full-height sections (use `min-h-[100dvh]`)
- Lucide as default icon set

---

## 8. Stitch Generation Notes

When prompting Google Stitch for new Newsplus screens:

1. **State the Design Read:** “Arabic-first editorial AI news product for journalists, trust-first navy/teal, asymmetric home, balanced density tool UI.”
2. **Attach this file** as the semantic source of truth.
3. **Specify screen** from Section 5 table and RTL default.
4. **Dial overrides:** Home → Variance 7, Motion 6, Density 4; Tool pages → Variance 5, Motion 4, Density 6.
5. **Real data only** in status and metrics areas.

**Reference tokens:** `design-system/tokens.css`  
**Brand doc:** `design-system/newsplus-design-system.md`  
**Stitch:** [labs.google.com/stitch](https://labs.google.com/stitch)
