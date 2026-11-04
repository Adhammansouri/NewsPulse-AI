# S06 · المسودة والمحرّر والكاروسيل والأرشيف

> **الهدف:** أهم سبرينت. عرض المسودة بالـ ٨ صيغ، ونسخ كل جزء لوحده، والجزء اللي اتعدّل بيتظلل، والنسخ ن١ ن٢ ن٣، والمحرّر جنب المسودة بخانة تعديل ظاهرة دايماً، وقواعد ذاكرة الفريق، والكاروسيل وصوره بتترسم، والأرشيف.

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S06-draft-editor-archive.md exactly.
Reference boards: Main-social, Main-briefing, Main-desk, Main-bulletin, Main-facts, Main-context, DeskDraft, DeskCarousel, DeskArchive,
MobDraft, MobDraft-video, MobDraft-carousel, MobDraft-briefing, MobDraft-desk, MobDraft-facts, MobDraft-revising, MobDraft-memory, MobDraft-error,
MobArchive, MobArchive-memory. Play the interactive Main board (generate → click the quick-revise chips → copy buttons) to see the exact behavior.
Rewrite EditorialDraft, RevisionThread, ConversationDrawer, MemoryRuleCard, CarouselDraft, SlideFrame to the new design; keep their data logic.
```

## Boards
Desktop: `Main-social` · `Main-briefing` · `Main-desk` · `Main-bulletin` · `Main-facts` · `Main-context` · `DeskDraft` · `DeskCarousel` · `DeskArchive`.
Mobile: `MobDraft` · `-video` · `-carousel` · `-briefing` · `-desk` · `-facts` · `-revising` · `-memory` · `-error` · `MobArchive` · `MobArchive-memory`.

## 1. Draft toolbar (desktop)
Left→right as in `Main-social`: «الخبر» back (ghost sm) · format `badge--ai` · version chips `vchip` (current `aria-current="true"`; click an older one → `POST /editorial/conversations/:id/restore`, which creates a new version) · on `DeskDraft` a ghost «قارن» link (S14, behind `features.diff`) · spacer · «تحويل الصيغة» **icon button** (swap) → back to the format deck keeping the story · «فحص ونشر» quiet sm (S12, behind `features.publishCheck`) · download icon · «نسخ الكل» `btn--ink btn--sm` (→ «تم النسخ» for 1.9s + toast).
Mobile (`MobDraft`): `m-bar` with back, format badge, version chips, «نسخ الكل».

## 2. AI provenance line
`ai-mark` in `--ink-3`: «كتبه المحرّر من {countPhrase(sources)} · راجعه قبل النشر»; when approved memory rules were applied: «… وطبّق {n} قواعد من ذاكرة الفريق · راجعه قبل النشر».

## 3. Blocks (`studio/DraftBlock.tsx`)
`block` + `block__label` (label left, `block__copy` right). Copy button: «نسخ» → «تم النسخ» (`is-done`) for 1.9s + toast «نُسخ {الخطاف|النص|الوسوم…}». Clipboard failure → toast «تعذّر النسخ» with «حدّد النص».
- `is-changed` + label «… · عُدّل في ن{n}» on blocks whose text differs from the previous version (compare the two versions' `copy` fields).
- First render of a version: container gets `typeset` (staggered reveal from CSS).

## 4. Format renderers (`studio/formats/*.tsx`) — exact structure from the boards
| Format | Blocks |
|---|---|
| `social` (`Main-social`) | الخطاف (`t-display` 22px) · النص · الوسوم (`tag` chips, LTR) · «خطافات بديلة · اضغط لاستبدال» (each a `tile tile--row` with swap icon → sends revise instruction «استبدل الخطاف بـ: …») |
| `video` (`DeskDraft`, `MobDraft-video`) | 9:16 cover card (navy radial, logo, duration, coral «الكوفر» tag, cover line) · عنوان النشر · الهوك · ٠–٣ ثوانٍ · النص · لقطات / CG (numbered `vchip`) |
| `carousel` (`DeskCarousel`, `MobDraft-carousel`) | see §6 |
| `desk` / `bulletin` / `facts` / `context` (`Main-desk/-bulletin/-facts/-context`, `MobDraft-desk/-facts`) | `doc` card: العنوان (bulletin: «النشرة») · المقدمة (not for bulletin/facts) · النص (not for facts) · points list with label «أبرز النقاط» (desk) / «الحقائق» (facts) / «لماذا يهم الآن» (context) — gradient dots |
| `briefing` (`Main-briefing`, `MobDraft-briefing`) | «موجز الساعة · أهم ٥ عناوين» + title `t-display` + numbered list (Alexandria numerals in `--cyan`, headline, «{source} · {time}»). Pinned items (S04) appear first. |

Map from the existing `NewsSummarizeData` fields (`title`, `dek`, `summary`, `bullets`, `sources`, `carousel`) — do not add API fields.

## 5. Editor aside (desktop 344px) / inline thread + dock (mobile)
- Header: AI `ic-wrap` 32px + «المحرّر» + «كل تعديل نسخة جديدة» (or «{n} نسخ محفوظة»).
- Messages: `msg--me` (user), `msg--ai` (assistant), `msg--sys` (restores: «رجعت للنسخة ١ ثم عدت للنسخة ٢»).
- While revising: AI bubble with small `PulseLine` + «يعدّل النص…»; mobile dock disabled with placeholder «استنى المحرّر يخلص…».
- Memory suggestion (`DeskDraft`, `MobDraft-memory` floating card `m-float`): for each `pendingMemory` rule — «المحرّر تعلّم قاعدة جديدة» (`t-ai`), rule text, rationale line, «احفظ للفريق» (`btn--ai sm`) · «عدّل» · «تجاهل» → existing `POST /editorial/memory/:id`.
- Dock: quick chips (`chip chip--sm chip--ai`) per format (= `qsets` in `Main.dc.html`; mobile adds «حوّله لفيديو»), textarea «اطلب تعديلاً… مثلاً: اجعل الخطاف سؤالاً», send (`send`, AI gradient). Enter sends, Shift+Enter new line.
- Revise error (`MobDraft-error`): `notice--error` «المحرّر ما قدرش يعدّل» + «النموذج ما ردّش. طلبك «{instruction}» محفوظ.» + «أعد المحاولة».

## 6. Carousel (`DeskCarousel`, `MobDraft-carousel`)
- Desktop: big selected slide (440px, logo, «n / N», headline Alexandria 30px, coral banner, attribution) + AI provenance line «الصورة مرسومة بالذكاء الاصطناعي من وصف المشهد · بدون وجوه حقيقية»; thumbnails grid (4 columns) with status badge under each; selected ring 2px `#0ea5e9`.
- Status mapping (`CarouselSlideStatus`): `pending` → `is-painting` shimmer + `badge--ai` «تُرسم…»; `ready` → `badge--ok` «جاهزة»; `mismatch` → `badge--warn` «راجعها» + `notice--warn` «الشريحة {n} لا تطابق نصها» + `slide.mismatch` text + «أعد الرسم»; `failed` → `badge--breaking` «فشل الرسم» + same notice pattern with «تعذّر رسم الشريحة {n}» + «أعد الرسم».
- Progress (mobile): `ai-panel` «يرسم الصور» + «{ready} من {total} جاهزة» + `meter`.
- Settings aside (desktop 340px): عدد الشرائح · الأسلوب (قصة/بطاقة preview tiles) · كثافة النص · علامة Newsplus switch · info notice «تغيير الأسلوب يعيد رسم الصور. النصوص الحالية تبقى كما هي.» · «حدّث الشرائح» (`btn--ai block`).
- Caption block + tags; header actions «تنزيل الصور» (quiet) and «نسخ النصوص» (ink).
- Keep `useCarouselPainter` and `POST /news/carousel/render` as they are.

## 7. Archive (`DeskArchive` drawer 500px, `MobArchive` screen)
- Header «الأرشيف» + «كل مسودة محفوظة بنسخها، ترجعلها وتكمّل منين ما وقفت» + close; search (debounced 300ms) «ابحث بعنوان المسودة…»; tabs `seg seg--block` «المسودات · N» / «ذاكرة الفريق · N».
- Drafts grouped by day (اليوم / أمس / date): row = format `ic-wrap` (AI gradient for the current one), title (ellipsis), meta «{format} · {countPhrase(versions, نسخة)} · {time}»; current conversation highlighted.
- Team memory (`DeskArchive` panel, `MobArchive-memory`): intro `ai-panel`; «مقترحة · محتاجة موافقتك» with an editable textarea card (counter «n / ٢٤٠», «إلغاء», «احفظ للفريق»); «القواعد الحالية» list with `switch` per rule (approved ↔ disabled) and meta («أُضيفت اليوم · من تعديلات {name}», «تُطبَّق منذ …», «موقوفة»).

## 8. Logic fixes
- Stable keys (no `key={bullet}`); revoke download object URLs after 1s, not immediately; debounce conversation search.

## Acceptance
- [ ] Every board in this sprint matches (light/dark), including copy states, changed-block highlight and typeset reveal.
- [ ] Quick-revise chips send the instruction, create a new version chip, highlight changed blocks — same as the interactive `Main` board.
- [ ] Restoring a version creates a new version and a `msg--sys` line.
- [ ] Memory approve/edit/dismiss and rule switches call the existing endpoints.
- [ ] Carousel statuses render as specified; regenerate works per slide.
- [ ] Old editorial CSS removed.
