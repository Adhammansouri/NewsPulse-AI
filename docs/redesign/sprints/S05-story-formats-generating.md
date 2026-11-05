# S05 · الخبر والصيغ و«المحرّر يكتب»

> **الهدف:** لوحة الخبر، واختيار الصيغة بأشكال المنصات، وزرار الكتابة اللي بيتسمّى حسب الصيغة، وحالة «المحرّر يكتب» بخطوات وخط نبض وskeleton بشكل الصيغة. على الموبايل الخبر بيفتح كشاشة كاملة.

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S05-story-formats-generating.md exactly.
Reference boards: Main (studio area, idle), Main-generating, MobStory, MobStory-carousel, MobGenerating.
Keep the existing summarize/editorial API calls; only the UI and the flow around them change.
```

## Boards
`Main` (studio, idle — play it: pick a story, pick a format, press the AI button) · `Main-generating` · `MobStory` · `MobStory-carousel` · `MobGenerating`.

## 1. Studio idle (desktop) — `studio/StoryPanel.tsx`, `studio/FormatDeck.tsx`, `studio/StudioFooter.tsx`
- Story `panel`: marks, source line («العربية ومصدر آخر» / «العربية و٢ مصادر أخرى» via `countPhrase`), relative time, «عاجل», topic; title `t-display` with item `dir`; excerpt `t-body` max 68ch; source link chips (`chip chip--soft chip--sm`, external icon, `target="_blank" rel="noopener"`).
- Placeholder for «تطور القصة» chip — render only when `features.timeline` (S14).
- Heading «ماذا ننشر؟ · للسوشيال» + `chip chip--ai chip--sm` «ذاكرة الفريق: N قواعد تُطبَّق تلقائياً» (N = approved rules from `GET /editorial/memory`; hide when 0).
- Social tiles (3 columns, `tile`, shape height 96): منشور سوشيال · سكريبت فيديو · كاروسيل بصور AI — copy the inline SVG shapes **exactly** from `Main.dc.html`. Selected tile: `aria-pressed="true"` + `tile__check`.
- «للموقع والنشرات» row (4 columns, `tile tile--row`): خبر مكتبي · نشرة · حقائق · سياق.
- Map tiles to the existing `NewsStoryFormat` ids (`social`, `video`, `carousel`, `desk`, `bulletin`, `facts`, `context`). Format names/hints/actions = the `F` object in `Main.dc.html`.
- Footer bar: AI `ic-wrap`, «{format name}» + «{hint} · من {countPhrase(sources)} · بأسلوب فريقك», ghost «الأرشيف» (opens the archive drawer — S06), primary `btn btn--ai btn--lg` with the format's action label («اكتب المنشور»، «اكتب السكريبت»، «اكتب وارسم الشرائح»…) and `Ctrl ↵` (also bound to Ctrl/⌘+Enter).
- The last chosen format is remembered (`localStorage newsplus-last-format`).
- Desktop carousel: no pre-generation settings panel (not designed) — generate with the last-used carousel options (default 4 slides, «قصة», «عنوان وشريط», mark on); settings are changed after generation in S06.

## 2. Generating (desktop `Main-generating`)
- Left/right split: `ai-panel ai-glow` (330px) with «المحرّر يكتب الآن» (`ai-mark t-ai`), format name (`t-title`), `PulseLine`, `AiSteps` (3 steps, texts per format = `stepsText` in `Main.dc.html`), «إلغاء» ghost. Next to it the story title (`t-meta`) and a skeleton shaped like the format (post / video 9:16 + lines / carousel 3 squares / document).
- Step timing is cosmetic: step 1 → 2 at 650ms, 2 → 3 at 1350ms, last step stays active until the response arrives; never mark it done early.
- «إلغاء» aborts the request (`AbortController`) and returns to idle.
- On success → draft view (S06) with the typeset animation.

## 3. Mobile story (`MobStory`, `MobStory-carousel`)
- Route `/news/:itemId` (mobile only; desktop keeps the 3-column page with `?item=`).
- `m-bar`: back (to the list, preserving scroll), «الخبر», open-source icon, archive icon.
- Article: meta, title `t-display` 22px, excerpt clamped to 3 lines.
- «ماذا ننشر؟» + `badge--ai` «بأسلوب فريقك»; social formats in the horizontal snap carousel `m-fmt` (tiles 146px); web formats 2×2 `tile--row` grid.
- Sticky `m-cta`: hint «{format} · {hint} · من {sources}» + `btn btn--ai btn--block btn--lg` action.
- Choosing «كاروسيل بصور AI» opens the settings `sheet` (`MobStory-carousel`): عدد الشرائح (٣/٤/٥/٦), أسلوب الصور (قصة/بطاقة tiles), كثافة النص (عنوان/عنوان وشريط/سطر توضيحي), علامة Newsplus switch, CTA «اكتب وارسم {n} شرائح». Values map to `CarouselOptions` (`slides`, `style`, `density`, `mark`).

## 4. Mobile generating (`MobGenerating`)
`m-bar` (back, format name, `badge--ai` «يكتب…») → AI panel (title, «حوالي N ثوانٍ» estimate, pulse line, 3 steps) → shaped skeleton → `m-cta` with hint «تقدر تكمّل تصفّح، وهنبلغك أول ما المسودة تجهز» + «تصفّح العناوين» (quiet) and «إلغاء» (ghost, `--breaking` color).
**Background completion:** if the user leaves, the request continues; when it resolves show a global toast «المسودة جاهزة: {format}» with «افتح» action (toast from S01).

## Acceptance
- [ ] Studio idle and generating match `Main` / `Main-generating` (light/dark); format tiles' SVG shapes identical.
- [ ] Action label and step texts change with the format exactly like the interactive `Main` board.
- [ ] Cancel aborts; Ctrl/⌘+Enter generates; last format remembered.
- [ ] Mobile story, carousel sheet and generating screens match their boards; leaving mid-generation still delivers the draft with a toast.
