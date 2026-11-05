# S10 · حالات النظام والرسائل والوضع الداكن والتنظيف

> **الهدف:** كل الأخطاء والرسائل بشكلها المصمم: رصيد OpenAI خلص، وحد الطلبات بعداد، والجلسة انتهت، والتعارض، والنسخ فشل. ومعاهم رسائل التأكيد، وتثبيت التطبيق وتحديثه. وفي الآخر مراجعة الوضع الداكن على كل الشاشات، ومسح كل الـ CSS والأيقونات القديمة. **بعد السبرينت ده الـ redesign الأساسي خلص بالكامل.**

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S10-system-states-cleanup.md exactly.
Reference boards: States, MobSystem (+ -quota, -ratelimit, -session, -install, -update, -logout) and all *-dark boards.
This sprint includes small backend changes (section 2) and the final cleanup (section 6).
```

## 1. Central error mapping — `src/services/toolErrors.ts` + `src/ui/ErrorSurface.tsx`
| Condition | Surface (copy verbatim from `States.dc.html` `errors[]` and `MobSystem.dc.html`) |
|---|---|
| Feed fetch fails | handled in S04 |
| AI upstream failure (5xx from summarize/revise/generate/translate) | `notice--error` «المحرّر ما قدرش يكمّل» + «أعد المحاولة»; the user's choice/instruction is kept |
| OpenAI quota (`insufficient_quota` / existing QuotaNotice condition) | `MobSystem-quota` sheet on mobile, `notice--warn` «رصيد OpenAI خلص» on desktop; «اشحن الرصيد» link only for admins (others see «بلّغ مسؤول النظام») |
| AI rate limit (429 on AI routes) | `MobSystem-ratelimit` floating card with countdown `Ring` («استراحة قصيرة للمحرّر» + «استخدمت ٢٤ طلب في ربع ساعة. تقدر تكمّل بعد m دقائق، والتصفّح شغال.»); desktop: same card bottom-center of the studio; AI buttons disabled until 0 |
| 401 on any call (expired session) | `MobSystem-session` dialog «الجلسة انتهت»; before redirecting, persist the unsent dock text / generate form to `sessionStorage` and restore after login |
| 409 conversation conflict | `notice--info` «المسودة اتعدّلت من مكان تاني» + «اعرض ن{n}» (refetch conversation) |
| Clipboard failure | `notice--error` / toast «تعذّر النسخ» + «حدّد النص» (selects the block text) |
Replace `QuotaNotice.tsx` with these surfaces.

## 2. Backend (small)
- `newsplus-API/src/middleware/aiRateLimit.ts`: send `Retry-After` (seconds) and `X-RateLimit-Remaining` on AI routes; prune expired buckets on each call (memory leak fix). Expose headers via CORS if needed.
- `newsplus-API/src/config/env.ts`: make `AUTH_SEED_PASSWORD` required in production (same `requiredInProduction` helper as `JWT_SECRET`). **Before merging, confirm with the owner that production already sets it** — otherwise the API will refuse to start.
- Add tests for both.

## 3. Toasts (`States` → «رسائل التأكيد»)
Wire every confirmation through `useToast()` with the exact copies: «نُسخ المنشور كاملاً» · «النسخة ٣ محفوظة» · «رجعت للنسخة ١» (+ «تراجع») · «القاعدة اتحفظت لذاكرة الفريق» (+ «تراجع») · «وصل إشعار التجربة» · «المسودة جاهزة: منشور سوشيال» (+ «افتح»). Numbers/format names are interpolated.

## 4. PWA chrome — `components/brand/pwa/*`
- Install: desktop card (`States` → «التطبيق على الجهاز») and mobile sheet (`MobSystem-install`: logo, «ثبّت Newsplus», benefits list, iOS `notice--info` steps, «تثبيت» / «لاحقاً»). iOS shows only the steps (no install button).
- Update available: desktop card / mobile `m-float` (`MobSystem-update`) «إصدار جديد جاهز» + «حدّث الآن» (AI) / «بعدين».
- Keep the existing detection logic (`pwaDetect.ts`, SW registration).

## 5. Dark mode QA
Open every screen in dark and compare with the dark boards (`Main-dark`, `DeskHome-dark`, `DeskCarousel-dark`, `DeskGenerate-dark`, `MobHome-dark`, `MobWire-dark`, `MobGenerating-dark`, `MobDraft-dark`) and with the light boards using the dark tokens. Fix any hard-coded color that ignores `data-theme`.

## 6. Final cleanup
- Delete all legacy CSS (old `index.css` sections, `newsroom.css`, any `brand-*`, `nd-*`, `tool-desk-*`, `gen-*` rules). `index.css` ends up importing only `styles/app.css` (and Tailwind only if something still uses it — prefer removing it).
- Remove `@phosphor-icons/react` and any remaining old icons.
- Delete unused components/hooks/services (search for zero imports).
- Replace `design-system/HYBRID.md`, `NEWSROOM.md`, `DESIGN.md` content with a short pointer to `docs/redesign/` as the single source of truth.

## Acceptance
- [ ] Every error/toast/PWA surface in `States` and `MobSystem*` is reachable and matches.
- [ ] Rate-limit countdown uses the server `Retry-After`; session-expired preserves unsent text.
- [ ] All `*-dark` boards match; no hard-coded colors left.
- [ ] Bundle CSS is substantially smaller than before (report old vs new size in the PR); no phosphor import remains.
- [ ] Full visual QA run: `node docs/redesign/qa-tools/shots.mjs all` reviewed.
