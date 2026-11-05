# S12 · «جاهز للنشر»: معاينة المنصات + فحص قبل النشر

> **الهدف:** قبل النسخ، الصحفي يشوف المنشور بشكل كل منصة ومعاه عدّاد الحروف، والمحرّر يراجع الإسناد والأرقام والطول وكلمات الفريق، ويصلّحهم بضغطة. **محتاج endpoint جديد في الباك إند.**

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S12-publish-ready.md exactly.
Reference boards: NewPublish (interactive: switch platforms, press «قصّره» / «استبدلها» / «صلّح الملاحظات تلقائياً»), MobNewPreview, MobNewCheck.
Backend first (section 1), then front-end.
```

## 1. Backend — `POST /editorial/conversations/:id/check`
Request: `{ platform?: "x" | "instagram" | "facebook" | "telegram" | "tiktok" }`. Response:
```ts
type PublishCheck = { id: string; status: "ok" | "warn" | "fail"; title: string; note: string; fix?: { label: string; instruction: string } };
type PublishCheckData = { versionId: string; checks: PublishCheck[] };
```
- Deterministic checks (no AI): length for the platform; hashtag count vs the team rule; words banned by approved memory rules (e.g. «صادم»); first-two-lines length for Instagram.
- AI check (one JSON call, counted by `aiRateLimit`): attribution of every claim + numbers match `sourcePacket`. Arabic `title`/`note` in the same tone as the board.
- Cache per `versionId`. Add shared types in `packages/shared`. Tests for the deterministic part.

## 2. Desktop view (`NewPublish`)
- Entry: «فحص ونشر» in the draft toolbar and shortcut `P` (`features.publishCheck = true`). Opens a focus view (rail + main, no wire) with a top bar: «المسودة» back, format badge, version chip, «انسخ للمنصة اللي هتنشر عليها، بالشكل المناسب ليها».
- Center: platform `seg` (X · إنستجرام · فيسبوك · تيليجرام · تيك توك) → `pf` frame (logo avatar, «Newsplus», handle from settings, platform `badge--topic`, body, optional media block, action bar icons). **No real platform logos or UI** — the neutral frame only.
- Under the frame: `ring` (% of limit; color `--teal-dot` < 85%, `--warn-dot` 85–100%, `--breaking-dot` > 100%) + limit title/note per platform (copy = `P` object in `NewPublish.dc.html`) + «نسخ لـ {platform}» (ink).
- Platform rules: X 280 characters including hashtags; Instagram — only the first ~125 characters show before «المزيد»; Telegram 4,096; Facebook — link goes in the first comment; TikTok — short caption, hook is spoken.
- Copy per platform: X = hook + tags (+ body if it fits); Instagram/Facebook = hook ⏎⏎ body ⏎⏎ tags; Telegram = hook ⏎ body; TikTok = hook + tags.
- Aside (390px `panel` + `ai-strip`): «فحص قبل النشر», summary badge (`badge--warn` «{countPhrase(warns, ملاحظة)} · {n} تمام» / `badge--ok` «٦ من ٦ تمام») — forms: «ملاحظة واحدة», «ملاحظتين», «٣ ملاحظات». `check-row`s (`ok`/`warn`/`fail` icons) with the `fix.label` quiet button → sends `fix.instruction` to the existing revise endpoint → new version → re-run the check. «صلّح الملاحظات تلقائياً» (AI) sends all fixes as one instruction. All OK → `notice--ok` «المسودة جاهزة للنشر. النسخة {n} محفوظة بالتعديلات.»

## 3. Mobile
- `MobNewPreview`: inside the draft add `seg seg--block` «المسودة | المعاينة» at the top of the content; المعاينة shows platform chips, the frame, a `notice--warn` for the main issue with its fix button, the ring row, and the CTA «نسخ لـ{platform}».
- `MobNewCheck`: opens automatically the first time the user copies a version that has warnings: `sheet` with summary, rows, «صلّح الملاحظات تلقائياً» (AI) and «انسخ زي ما هو» (copies anyway).

## Acceptance
- [ ] `NewPublish` behaves exactly like the interactive board (platform switch, ring, fixes, all-OK notice).
- [ ] Mobile preview and check sheet match their boards.
- [ ] Checks are cached per version; a fix creates a new version and re-checks.
