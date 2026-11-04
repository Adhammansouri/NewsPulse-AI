# S02 · هيكل التطبيق والتنقل

> **الهدف:** الشريط الجانبي الكحلي على الديسكتوب، والتابات تحت بزرار التوليد في النص على الموبايل، وشاشة البدء، ولودر التنقل، وصفحة "بدون اتصال"، و**زرار تسجيل الخروج اللي مكانش موجود أصلاً**.

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S02-shell-navigation.md exactly.
Reference boards: RouteLoader, Splash, Splash-offline, MobSplash, MobSplash-offline, MobMore, MobSystem (offline banner), MobSystem-logout.
Keep all pages' inner content as it is; this sprint only replaces the shell around them.
```

## Boards
`RouteLoader` (interactive — click the rail items) · `Splash` · `Splash-offline` · `MobSplash` · `MobSplash-offline` · `MobMore` · `MobSystem` · `MobSystem-logout`. Rail/tab bar markup: any desktop board (`Main.dc.html` `<nav class="rail">`) and any mobile board with `m-tabbar`.

## 1. Replace the shell
- New `src/components/layouts/MainLayout.tsx`:
  - Desktop (≥1024): `<div style="display:flex;height:100dvh">` → `<Rail/>` + `<Outlet/>`.
  - Mobile (<1024): `<Outlet/>` + `<TabBar/>` **only on tab screens** (`/`, `/news`, `/generate`, `/translate`, `/more`, `/board`). Detail screens (story, draft, generating, archive, notifications, usage) hide the tab bar, exactly as the mobile boards show.
- Delete when unused: `Header.tsx`, `BrandSideRail.tsx`, `Footer.tsx`, `ToolPage.tsx`, `ToolShell.tsx`, `useRailCollapsed.ts`, `railCollapseStore.ts`, `components/brand/{BrandHeroLockup,FeatureCard,HeroCta,SystemStatus}.tsx`, `DeskPulse.tsx`, `DeskTools.tsx` (keep `DeskCompose`/`DeskHeadlines` until S07).

## 2. `Rail` (desktop) — `src/components/shell/Rail.tsx`
Order and labels exactly as the reference: logo · الرئيسية `/` · الأخبار `/news` · سير العمل `/board` · توليد `/generate` · ترجمة `/translate` · الاستهلاك `/usage` · spacer · keyboard button · notifications link · theme button · avatar.
- `سير العمل` is behind `features.workflow` (`src/config/features.ts`, default `false` until S15). The keyboard button is behind `features.shortcuts` (until S11).
- **الاستهلاك only for `session.user.role === "admin"`** (the API returns 403 to others).
- `aria-current="page"` on the active item. While a navigation to that item is pending, add `is-loading` to it.
- Notification button shows `dot-badge` only when push permission is `default` (never asked) — a nudge to enable.
- Avatar (initial of `displayName`, AI gradient) opens a `Popover`: name, role label «مدير»/«محرر», theme `Segmented` (فاتح / داكن), and «تسجيل الخروج» (`btn--danger`) → logout dialog (§5).

## 3. `TabBar` (mobile) — `src/components/shell/TabBar.tsx`
`m-tabbar` with 5 tabs: الرئيسية · الأخبار · **توليد (`m-tab--ai`, raised center)** · ترجمة · المزيد. `aria-current="page"` on the active tab. Padding-bottom adds `env(safe-area-inset-bottom)`.

## 4. «المزيد» screen (mobile) — route `/more`
Build `MobMore` exactly: large title, profile card (`ai-panel`), sections الإدارة (استهلاك AI — admin only, value = current-period cost when available; ذاكرة الفريق → archive memory tab), التفضيلات (إشعارات العاجل with status badge → `/notifications`; المظهر segmented; لغة الواجهة segmented — UI language switch is **only wired for the login screen** today: keep the control but disable it with `aria-disabled` outside login until i18n exists), التطبيق (ثبّت التطبيق → PWA install flow; تسجيل الخروج). Footer «Newsplus · الإصدار ٤» uses the app version from `package.json`. On desktop `/more` redirects to `/`.
`سير العمل` row appears only when `features.workflow` is on.

## 5. Logout (new — was missing)
- Confirmation dialog = `MobSystem-logout` (`m-dialog` on mobile, centered `Dialog` on desktop with the same content).
- On confirm: `authService.logout()` (POST `/auth/logout`), clear session store, clear TanStack Query cache, navigate `/login`.

## 6. Splash & session check
`RequireAuth` currently renders nothing/plain while checking `/auth/me`. Render `<Splash state="checking"/>` (`Splash` / `MobSplash` boards: navy background, logo 96px, «Newsplus», pulse line, «بنتأكد من جلستك ونجهّز غرفة الأخبار…» — mobile text «بنتأكد من جلستك…» at the bottom). Minimum display 300ms to avoid a flash.

## 7. Offline
- In-app banner: `useOnline()` hook (`online`/`offline` events). When offline show the navy `m-banner` at the top of the current screen (mobile) / the rounded banner at the top of the content (desktop, `DeskHome-offline`) with copy from the boards and a «حاول تاني» button that refetches active queries.
- Full offline page (`Splash-offline` / `MobSplash-offline`): restyle `public/offline.html` (served by the SW) to match — inline the CSS it needs, system fonts fallback, Arabic copy verbatim, «حاول تاني» reloads, and the live line «بنحاول تلقائياً كل ١٥ ثانية» (auto-retry every 15s).

## 8. Route loader
- Convert page imports in `routes/index.tsx` to `React.lazy`.
- `<RouteBar/>`: the `route-bar` element (3px AI-gradient bar at the top of the content area) visible while a lazy route is loading **or** while the destination page's primary query is in its first load.
- Each page provides a skeleton fallback shaped like its layout (see `RouteLoader` board: split layout for news/generate, stacked for home/translate). Use the `Skeleton` component.

## Acceptance
- [ ] Desktop rail and mobile tab bar match the boards pixel-for-pixel (light/dark), including active, hover and loading states.
- [ ] Non-admin users never see «الاستهلاك».
- [ ] Logout works from the avatar menu and from «المزيد», with the confirmation dialog.
- [ ] Splash shows during session check; offline banner appears/disappears with the network; `offline.html` matches the board.
- [ ] Clicking rail items shows the route bar + skeleton like the `RouteLoader` board.
- [ ] Old header/side-rail/footer code is deleted; no dead imports.
