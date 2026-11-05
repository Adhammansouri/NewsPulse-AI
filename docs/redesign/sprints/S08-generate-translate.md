# S08 · التوليد والترجمة

> **الهدف:** شاشتين بنفس المنطق: الإدخال الأول، وبعده النوع، وبعده الضبط، وزرار واحد. والنتيجة جنبها بكل حالاتها. ومعاهم إصلاحات: المسودات بتتحفظ فعلاً بعد قفل التاب، والترجمة بتكتشف اللغة لوحدها، ولو عدّلت الأصل بيظهرلك تنبيه بدل ما الترجمة تتمسح.

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S08-generate-translate.md exactly.
Reference boards: DeskGenerate (interactive) + DeskGenerate-writing/-done/-error/-drafts, DeskTranslate (interactive) + DeskTranslate-busy/-done/-stale,
MobGenerate + MobGenerate-writing/-done/-error/-drafts, MobTranslate + MobTranslate-busy/-done/-stale (+ DeskGenerate-dark).
```

## A. Generate — `src/modules/Generate`
**Form column (desktop 470px, `DeskGenerate`)**, top→bottom:
1. Header «توليد» + «مقال أو تقرير أو ملخص من رابط أو موضوع» + ghost «مسوداتي · {n}» (opens drafts popover).
2. «المصدر»: `field` with link icon. Valid URL → `is-valid` + `hint--ok` «رابط من {domain} · سيقرأ المحرّر المقال كاملاً». Notes `field--area field--sunken` «ملاحظات اختيارية: الجمهور، تفاصيل تريد التركيز عليها…».
3. «ماذا تكتب؟»: 3 `tile`s with the reference SVG shapes — ملخص · مقال · تقرير; word ranges from the existing `generateDesk.ts` (show them in Arabic digits).
4. «الضبط»: rows with `seg` — اللغة (عربي/English) · الطول (أقصر/قياسي/أطول) · النبرة (مكتبية/رسمية/تفسيرية); «زاوية التغطية» chips (اقتصادي/سياسي/إنساني/محلي/تقني) + existing free-text angle if present.
5. Footer: `btn--ai btn--block btn--lg` «اكتب {الملخص|المقال|التقرير}» + `Ctrl ↵`; limits line from the existing validation constants («التعيين حتى … حرف · الزاوية حتى … حرف»).

**Result area:**
- Empty: AI `empty__art`, «مسودتك هتظهر هنا», text, two info rows (رابط / موضوع).
- Writing: `ai-panel ai-glow` «المحرّر يكتب {style}» + pulse + steps («فتح الرابط وقراءة المقال» · «كتابة {style} بزاوية {angle}» · «مراجعة الأسماء والأرقام») + doc skeleton.
- Done: toolbar (style `badge--ai`, source-mode `badge--teal` «من الصفحة»/«بالبحث»/«من التعيين» from the API `sourceMode`, «{n} كلمة · {m} دقائق قراءة», «ترجم» → translate handoff, «حوّله لمنشور سوشيال» → news summarize with this article as `input`, download, «نسخ الكل») + `doc` with `ai-strip`, provenance line, blocks العنوان (`t-hero` 30px) / المقدمة / النص with copy.
- Error (`DeskGenerate-error`): URL rejected (fetch blocked / paywall / private network) → field `is-error` + `hint--error` «الموقع رفض الوصول للصفحة» + `ai-panel` «المحرّر يقدر يكمّل بطريقة تانية» with «ابحث عن الخبر» (AI → retry with `sourceMode: search`) and «الصق النص» (focus notes, clear URL).

**Drafts («مسوداتي», `DeskGenerate-drafts`):** popover anchored to the header button: «مسوداتي» + «محفوظة على الجهاز ده · آخر ٢٠»; rows (style badge, title, «{source mode} · {words} كلمة · {time}», delete icon) + «امسح كل المسودات» (`--breaking`). **Fix:** move storage from `sessionStorage` to `localStorage` (`newsplus-generate-drafts`, max 20, newest first).

**Mobile (`MobGenerate*`):** `m-head` with «مسوداتي · N»; source textarea with chips «الصق من الحافظة» and «آخر عاجل: {headline}»; 3 tiles; «الضبط» summary row (`m-list` style) showing «عربي · قياسي · مكتبية · اقتصادي» + «تعديل» → a `sheet` containing the same controls as desktop §4 (approved adaptation); sticky AI CTA (disabled with hint «الصق رابط أو اكتب موضوع عشان تبدأ» while empty). Writing/done/error/drafts exactly as the mobile boards (drafts = `sheet`).

## B. Translate — `src/modules/Translate`
**Desktop (`DeskTranslate*`):** header «ترجمة صحفية» + «تحافظ على الأسماء والأرقام والاقتباسات، وتكتب بأسلوب صحفي لا حرفي»; direction pill («من · اكتُشفت تلقائياً» {lang} / swap / «إلى» {lang}); two equal panels.
- Source panel: `seg` نص/رابط + char count; text mode = borderless textarea; URL mode = `field is-valid` + hint «المحرّر يستخرج نص المقال فقط، بدون القوائم والإعلانات» + after success the «النص المستخرج · {n} حرف» preview; footer «عدّل الأصل» (only after a result) + AI button.
- Button label: «ترجم إلى {الإنجليزية|العربية}» · URL: «استخرج وترجم» · busy: «جاري الترجمة…» **disabled** · done: «ترجم مرة أخرى» · stale: «أعد الترجمة».
- Output panel: empty («الخبر بلغته الجديدة») · busy (pulse + «يترجم ويراجع الصياغة…» + skeleton) · done (typeset article in target `dir`/font, footer «راجع الترجمة قبل النشر» + «استخدمها في منشور» + «نسخ الترجمة») · stale (`notice--warn` «عدّلت الأصل بعد الترجمة. الترجمة القديمة ظاهرة لحد ما تضغط «أعد الترجمة».» + output at 55% opacity).
**Mobile (`MobTranslate*`):** `m-head` «ترجمة» + seg; direction pill; source card (3-line clamp after a result, «عدّل الأصل»); output `ai-panel` with `ai-strip`; bottom CTA; tab bar.

**Logic fixes:**
- Auto-detect direction: Arabic-script ratio > 0.3 → ar→en, else →ar. Swap overrides until the text changes language.
- Editing the source after a result → **stale** state (never wipe the translation).
- Increment the daily «ترجمات» counter (S07) on success.

## Acceptance
- [ ] All Generate and Translate boards match (light/dark).
- [ ] Drafts survive closing the tab; delete one/all works.
- [ ] Rejected URL shows the AI fallback; «ابحث عن الخبر» retries with search mode.
- [ ] Direction auto-detects; stale works; busy disables the button.
- [ ] Old `translate.css` and Generate-specific old CSS removed.
