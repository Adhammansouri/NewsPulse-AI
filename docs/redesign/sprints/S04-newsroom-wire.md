# S04 · غرفة الأخبار: قائمة العناوين والتصفية

> **الهدف:** عمود العناوين الجديد بمؤشر عمر الخبر، والتصفية في صفين بدل أربعة، ونافذة التصفية، وحالات التحميل والفراغ والخطأ، والسحب للتحديث، وسحب الخبر لأكشن سريع على الموبايل. ومعاها إصلاحات اللوجيك (الـ debounce، وثبات الخبر المختار، والعناوين ما تتقفلش وقت التوليد).

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S04-newsroom-wire.md exactly.
Reference boards: Main (wire column only), Main-loading, Main-empty, Main-error, Main-filters,
MobWire, MobWire-loading, MobWire-refresh, MobWire-swipe, MobWire-empty, MobWire-error, MobFilters.
The studio area (story/formats/draft) is S05–S06: keep the current story preview there for now.
```

## Boards
Desktop: `Main` (wire column), `Main-loading`, `Main-empty`, `Main-error`, `Main-filters`.
Mobile: `MobWire`, `MobWire-loading`, `MobWire-refresh`, `MobWire-swipe`, `MobWire-empty`, `MobWire-error`, `MobFilters`.

## 1. Structure
- `src/modules/News/pages/NewsPage.tsx` becomes an orchestrator. Extract:
  - `wire/WireColumn.tsx` (desktop column 420px) · `wire/WireHeader.tsx` · `wire/WireRow.tsx` · `wire/WireStates.tsx` (loading/empty/error) · `wire/FilterPopover.tsx` (desktop) · `wire/FilterSheet.tsx` (mobile) · `wire/NewItemsPill.tsx`.
  - Mobile list screen = `MobWire` (large `m-head`, search + filter button, topic chips, list, tab bar).
- Delete `NewsFilters.tsx`, `SourcePicker.tsx` and `newsroom.css` rules for the old wire once replaced.

## 2. Header
- Title «الأخبار» (`t-title` 22px desktop / `m-title` mobile) + live line: «مباشر · {countPhrase(n, عنوان)} · حُدّث {relativeTime(fetchedAt)}». Mobile shows «مباشر · N عناوين».
- Refresh icon button (desktop) → refetch. Mobile uses pull-to-refresh.
- «موجز الساعة» button (bolt icon in `--cyan`) → starts the briefing generation (existing `briefing: true` flow; UI in S06).
- Search `field field--sunken` with placeholder «ابحث في العناوين…»; desktop shows the `/` key hint and focuses on `/`.
- Filter `icon-btn icon-btn--line` with `badge--count` = number of active filters in the popover/sheet (language + sources).
- Time `seg seg--block`: الكل · ٢٠ د · ساعة · ٣ س · اليوم → existing `TIME_FILTERS` ids in that order (`fresh` = 20 min, keep `FRESH_MS`).
- Topic chips (`chip chip--sm`) with counts, horizontal scroll, `aria-pressed`.

## 3. Wire row (`WireRow`)
- Classes: `wire-row` (desktop) / `m-row` (mobile) + freshness: `is-breaking` (item.breaking), else `is-now` (< 20 min), `is-hour` (< 60 min), none (older).
- Meta: `SourceMarks` (max 2), first source name (`font-weight:600; color: var(--ink-2)`), `+N` other sources (Arabic digits), relative time on the far side.
- Title `wire-row__title` with `dir` from item language.
- Foot: «عاجل» `badge--breaking` · topic `badge--topic` · «مسودة جاهزة» `badge--ai` when an editorial conversation exists for `item.id` (from the conversations list query).
- Selected row: `aria-pressed="true"` (desktop) — background gradient + AI bar from CSS.

## 4. New headlines pill
When polling returns items newer than the newest rendered one, do **not** insert them. Show `wire-new` «{countPhrase(n, عنوان جديد)}» (e.g. «عنوانان جديدان») at the top of the list. Click → insert with class `arrive`, scroll list to top. Never move the user's selection.

## 5. Filters popover / sheet
- Desktop `Main-filters`: `popover` anchored under the search row, width = column − 32px: «تصفية» + «مسح الكل»; اللغة `seg seg--block` (الكل/عربي/English); المصادر grid of `tile tile--row` buttons with marks (`aria-pressed`); «عرض النتائج».
- Mobile `MobFilters`: `sheet` with grabber; الوقت + اللغة `seg seg--block`; المصادر with search field and `m-list` of rows (mark, name, language, `check`); sticky «عرض {N} عناوين» (live count).
- **Multi-source selection**: the API accepts one `source`; filter client-side over the full feed (items carry `sources[]`). Persist filters in the URL query (`?time=&topic=&lang=&src=a,b`).

## 6. States
- Loading: 6 skeleton rows shaped like `Main-loading` / `MobWire-loading` (mark circle, two text lines). Live line «جاري التحميل…».
- Empty (filters too narrow): `Main-empty` / `MobWire-empty`. Copy template from the board, filled with the active filters: «مفيش أخبار {topic} في آخر {time} من المصادر المختارة. آخر خبر {topic} كان قبل {x}.» + «وسّع الوقت لساعة» (next wider time filter) + «امسح التصفية». Mobile also shows the active filters as removable chips.
- Error: `notice--error` «تعذّر جلب العناوين» + «بتشوف آخر نسخة من {time}» + «حاول تاني»; keep showing cached rows (mobile dims them to .6).
- Pull-to-refresh (mobile, `MobWire-refresh`): pull ≥ 64px on the list → `ptr` with `PulseLine` and «جاري جلب أحدث العناوين…» until refetch settles.

## 7. Swipe actions (mobile, `MobWire-swipe`)
Swipe a row towards the start edge to reveal two actions (96px each): «اكتب منشور» (AI gradient → opens the story with «منشور سوشيال» selected and starts generation) and «للموجز» (navy → pins the item for the next briefing). Snap open at 192px, close on tap outside. Pinned items show in the briefing (S06).
**Backend (small):** extend `NewsSummarizeRequest` (shared types) with `itemIds?: string[]` (max 8) used only when `briefing: true`; `newsService` puts those items first. Store pins in `localStorage` (`newsplus-briefing-pins`, max 8).

## 8. Logic fixes (from the code review)
- Debounce search 300ms before it enters the feed query key (`useDebouncedValue`). Same for the conversation search (S06).
- Never auto-switch the selected story when filters exclude it: keep it open in the studio; only auto-select the first item on the very first desktop load.
- The wire stays interactive while AI is generating (no disabled rows). If the user opens another story mid-generation, the result is still saved (it lands in the archive) and a toast says «المسودة السابقة جاهزة في الأرشيف».
- `?item=` deep link opens that story (mobile goes straight to the story screen).

## Acceptance
- [ ] Wire column/list matches `Main` and `MobWire` (light/dark); ~7 rows visible at 1440×900 (was 3).
- [ ] Filters popover and sheet match their boards; multi-source works; filters survive reload via URL.
- [ ] Loading/empty/error/pull-to-refresh/swipe match their boards.
- [ ] Typing in search fires one request per pause, not per keystroke.
- [ ] Selected story never changes by itself; rows clickable while AI writes.
