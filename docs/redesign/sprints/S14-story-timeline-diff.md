# S14 · تطور القصة وتعارض المصادر + مقارنة النسخ

> **الهدف:** خط زمني بيوري إزاي الخبر اتطور من مصدر للتاني، وتنبيه لما مصدرين يختلفوا في رقم عشان ما يتنشرش رقم مش مؤكد. ومقارنة أي نسختين بالأحمر والأخضر. **تطور القصة محتاج شغل باك إند، لكن المقارنة فرونت بس.**

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S14-story-timeline-diff.md exactly.
Reference boards: NewTimeline, MobNewTimeline, NewDiff, MobNewDiff.
Part A needs backend work; Part B (diff) is front-end only — you may ship B first.
```

## Part A · Story timeline & source conflicts
### Backend
1. **Snapshots:** when the aggregator adds a source to an item or a source's headline/excerpt changes, persist `{ itemId, sourceId, at, headline, excerpt, url }` (new table/collection `story_updates`, keep 48h).
2. `GET /news/items/:id/timeline` →
```ts
type TimelineEntry = { sourceId: string; at: string; headline: string; tag: "first" | "number" | "quote" | "reaction" | "update"; isNew: boolean };
type SourceConflict = { field: string; values: { sourceId: string; value: string }[]; safeWording: string };
type TimelineData = { entries: TimelineEntry[]; conflicts: SourceConflict[]; agreed: { text: string; sourceCount: number }[]; confirmedBy: number };
```
`tag` and `conflicts`/`agreed` come from one cheap JSON LLM call per new snapshot (cached by item + snapshot count).
3. Extend `NewsSummarizeRequest` with `constraints?: string[]` (e.g. «اذكر التضخم: ٢٫٩٪ بحسب العربية و٣٫١٪ بحسب سكاي») injected into the prompt.

### Front-end
- Story tabs (desktop and mobile): `seg` «الخبر | تطور القصة · {n} | المصادر» + `badge--ok` «مؤكد من {countPhrase(n, مصدر)}». The S05 chip «تطور القصة · {n} تحديثات» opens the timeline tab (`features.timeline = true`).
- Timeline `panel`: title, «{n} تحديثات خلال {m} دقيقة · آخر تحديث {relative}», `tl` list (time column, dot: `is-first` coral, `is-new` teal, marks, source name, tag badge, headline). When a draft exists and a newer entry arrives → `ai-panel` «فيه تحديث جديد من {source}. المسودة اللي كتبتها من {x} ممكن تتحدّث بيه.» + «حدّث المسودة» (revise instruction with the new info).
- Conflict card (warn border + ring): «المصادر مختلفة في رقم», the two values side by side (`t-num` 24px), «المحرّر هيكتب «{safeWording}» لحد ما تختار، عشان ما ينشرش رقم مش مؤكد.», actions «اعتمد {v1}» · «اعتمد {v2}» · «اذكر الرقمين بالإسناد» (ink) → stored as `constraints` for this item and sent with every generation.
- «اللي متفق عليه» list + CTA «اكتب من القصة كاملة» (AI).
- «المصادر» tab: list of source links (mark, name, time, external link).

## Part B · Version diff (front-end only)
- Entry: «قارن» next to the version chips (desktop `DeskDraft` toolbar, `features.diff = true`); on mobile the version chips open an action sheet with «قارن النسخ».
- Compare bar: «قارن» + two `seg`s (from / to versions) with a swap icon; desktop also «في سطر واحد | جنب بعض».
- Word diff per field between the two versions' `copy` (use the `diff` package, `diffWords`): removed → `<del class="d">`, added → `<ins class="d">`. Summary badges «{n} حذف» / «{n} إضافة» + «بين ن{a} ({time}) و ن{b} ({time})». Unchanged fields show «بدون تغيير».
- Side panel «إيه اللي اتطلب»: the user instructions between the two versions (from `messages`).
- Actions: «اعتمد ن{b}» (keep as current — restore if it isn't) · «رجّع ن{a}» (restore) + note «الرجوع بيعمل نسخة جديدة، ومفيش حاجة بتتمسح».
- «جنب بعض» (not separately designed): two equal `doc` columns, deletions only on the left version, additions only on the right.

## Acceptance
- [ ] Timeline and diff boards match (light/dark).
- [ ] A conflict choice changes the next generated draft (constraint visible in the draft text).
- [ ] Diff counts and highlights are correct for every format's fields.
