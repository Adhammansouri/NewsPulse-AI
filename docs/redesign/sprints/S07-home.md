# S07 · الرئيسية «مكتب اليوم»

> **الهدف:** الرئيسية الجديدة: خانة ذكية تبدأ منها برابط أو فكرة، وشريط العاجل، و«كمّل شغلك»، وأهم العناوين، و«شغلك النهارده»، وكارت ذاكرة الفريق. ومعاها حالتي التحميل وبدون إنترنت. وبيات السيرفر التقنية بتتشال من هنا.

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S07-home.md exactly.
Reference boards: DeskHome, DeskHome-loading, DeskHome-offline, MobHome, MobHome-loading, MobHome-offline (+ DeskHome-dark, MobHome-dark).
```

## Boards
`DeskHome` · `DeskHome-loading` · `DeskHome-offline` · `MobHome` · `MobHome-loading` · `MobHome-offline` · dark: `DeskHome-dark`, `MobHome-dark`.

## 1. Header
- Date line «{weekday} {day} {month} · {h:mm ص/م}» in Arabic digits (`Intl.DateTimeFormat('ar-EG')` then `toArabicDigits`).
- Greeting `t-hero`: «صباح الخير، {displayName}» before 12:00, «مساء الخير، {displayName}» after.
- Live line: «{countPhrase(n, عنوان جديد)} منذ آخر زيارة» — store `newsplus-last-visit` timestamp on leave; n = feed items newer than it. Hide when 0.

## 2. Compose (`ai-panel`)
- Title row: AI `ic-wrap` + «ابدأ من رابط أو فكرة»; hint «المحرّر يتعرّف على الرابط تلقائياً».
- Textarea (`field field--area`, `is-focus` when focused). URL detection (http/https) → `badge--teal` «رابط من {domain}» with check icon; URLs are LTR.
- Actions: «ترجم» (ghost) → `/translate` with the text/URL handoff · «اكتب مقالاً» (quiet) → `/generate` with handoff · primary `btn--ai`: «منشور سوشيال من الرابط» (URL) / «منشور سوشيال» (topic) → summarize with `input` + `format: social`, then open the draft. Reuse `deskHandoff.ts`.
- Mobile: same panel; primary full width; ترجم / اكتب مقالاً as two quiet buttons.

## 3. Breaking strip
Only when a breaking item exists in the last 20 minutes: coral-soft panel with bolt `ic-wrap--breaking`, «عاجل الآن», «قبل {x} · {countPhrase(sources)}», headline, «اكتب عنه» (ink) → story. Mobile: the stacked card with «اكتب عنه ←».

## 4. Grid (desktop 1.15fr / 1fr / .85fr)
- **كمّل شغلك**: last 4 editorial conversations (+ the latest Generate draft from S08 storage): format `ic-wrap` (AI gradient for the most recent), title, «{format} · ن{versionCount} · {time}» → opens it. Link «الأرشيف».
- **أهم العناوين الآن**: 4 `wire-row`s (freshness ticks) → story. Link «غرفة الأخبار».
- **شغلك النهارده** (`t-num` 28px): مسودات (conversations created today) · تعديل بالمحرّر (Σ versionCount−1 of today's conversations) · ترجمات · شرائح مرسومة. The last two are local daily counters (`newsplus-daily-stats`, reset at local midnight) incremented on successful translate / slide ready.
- **Memory card** (`ai-panel`, link to archive memory tab): «المحرّر تعلّم قاعدة جديدة» + newest approved rule text + «ذاكرة الفريق · {n} قواعد مفعّلة». Hide when there are no rules.
- Mobile order: compose → breaking → «كمّل شغلك» horizontal cards (220px, format badge, version chip, time) → «أهم العناوين» (3 rows in an `m-list`).

## 5. States
- Loading: skeletons exactly as `DeskHome-loading` / `MobHome-loading` (compose stays interactive).
- Offline: banner (S02) + compose AI disabled at 55% opacity with hint «المحرّر محتاج إنترنت. هيشتغل أول ما الشبكة ترجع.»; cached lists stay.

## 6. Remove
`DeskGreeting`, `DeskHeadlines`, `DeskCompose` old markup (logic moves into the new components), the server-health/system-status block, and their CSS.

## Acceptance
- [ ] All 8 home boards match (light/dark).
- [ ] URL detection, handoffs and the AI button work end-to-end.
- [ ] Breaking strip appears only with a fresh breaking item; stats/counters reset daily.
