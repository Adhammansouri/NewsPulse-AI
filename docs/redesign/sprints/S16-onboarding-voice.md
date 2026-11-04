# S16 · أول تشغيل «علّم المحرّر أسلوبك» + الإملاء الصوتي

> **الهدف:** أول ما المستخدم يدخل يختار منصاته ومصادره، ويختار الخطاف الأقرب لأسلوبه، فيتحفظ في ذاكرة الفريق. وعلى الموبايل يقدر يقول التعديل بصوته بدل ما يكتبه.

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S16-onboarding-voice.md exactly.
Reference boards: NewOnboarding, MobOnboard, MobOnboard-two, MobOnboard-three, MobNewVoice. Backend first (section 1).
```

## 1. Backend
- `GET/PUT /me/preferences` → `{ platforms: string[]; sources: string[]; hookStyle?: "direct" | "question" | "number"; onboardedAt?: string }`.
- `POST /editorial/memory` (create) → `{ instruction, rationale }` created as `approved` by the current user (today only status changes exist).
- Shared types + tests.

## 2. Onboarding — route `/welcome`
- Shown once after login when `onboardedAt` is empty; «تخطّي» / «تخطّي الإعداد» sets `onboardedAt` without saving choices.
- Step 1 «بتنشر فين؟» — platform rows (X، إنستجرام، فيسبوك، تيليجرام، تيك توك) with descriptions and `check`; drives the platform tab order in S12.
- Step 2 «بتتابع مين؟» — source tiles (2-column grid, marks) from `/news/sources`; becomes the default wire source filter.
- Step 3 «علّم المحرّر أسلوبك» — the same story in three hook styles (مباشر / سؤال / رقم) as selectable `tile--row`s + the AI note «هيتحفظ كقاعدة في ذاكرة الفريق ويتطبّق من أول مسودة.» On «ابدأ الشغل»: save preferences, create the memory rule (e.g. question → «ابدأ خطافات الأخبار بسؤال مباشر يخص القارئ.»), go Home.
- **Example story:** use the newest real headline from the feed and generate the three hook variants with one small LLM call (`POST /news/hook-styles { itemId }` → `{ direct, question, number }`, add to backend in §1); while loading show three `sk` rows.
- Mobile = `MobOnboard*` (stepper, title, subtitle, content, bottom CTA «التالي» / «رجوع» / AI «ابدأ الشغل»).
- Desktop = `NewOnboarding` frame (form side + navy summary side «غرفة أخبارك جاهزة» listing the choices so far). Steps 1–2 on desktop are not separately designed: use the same frame with the mobile step content in the form side (approved adaptation).

## 3. Voice dictation (mobile, `MobNewVoice`)
- In the revise dock, when the textarea is empty the send button shows the **mic** icon (same `send` button style); with text it is send. Hidden entirely when `SpeechRecognition`/`webkitSpeechRecognition` is unavailable.
- Listening panel (replaces the dock, rounded top 26px, shadow): «بسمعك…» live dot + elapsed `m:ss`; live transcript (interim text in `--ink-3`, caret); `wave` bars; actions «إلغاء» · stop button (64px AI square with stop icon → sends the transcript to the editor) · «عدّل النص» (moves the transcript into the textarea); note «بالعربي أو الإنجليزي · هيتبعت للمحرّر أول ما توقف».
- Recognition `lang = "ar-EG"`, `interimResults = true`, auto-stop after 2s of silence or 60s. Content behind the panel dims to 55% (`aria-hidden`).

## Acceptance
- [ ] Onboarding boards match; choices persist and affect the wire filter, platform tab order and the editor (new memory rule visible in the archive memory tab).
- [ ] Voice works on Chrome Android; the mic is hidden where unsupported; the transcript reaches the editor as a normal revise.
