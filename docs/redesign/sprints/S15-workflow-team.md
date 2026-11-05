# S15 · سير العمل والفريق

> **الهدف:** لوحة بتمشي فيها المسودة: مسودة ← مراجعة ← جاهز ← اتنشر. وبيبان مين بيكتب إيه دلوقتي، وفيه تنبيه لو فتحت خبر زميلك شغال عليه. **محتاج باك إند: حالة لكل مسودة وتواجد لحظي.**

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S15-workflow-team.md exactly.
Reference boards: NewBoard, MobNewQueue. Backend first (section 1). At the end set features.workflow = true.
```

## 1. Backend
- Editorial conversations get `status: "draft" | "review" | "ready" | "published"` (default `draft`), `assigneeId` (default creator), `publishedPlatforms: string[]`, `commentCount: number` (0 for now). Migration for existing rows.
- `PATCH /editorial/conversations/:id` `{ status?, assigneeId?, publishedPlatforms? }` — any team member; log a system message («نقلتها سارة لمراجعة»).
- `GET /editorial/conversations?scope=team|mine&status=` returns the new fields + assignee `{ id, displayName, color }`.
- Presence: `POST /presence/heartbeat` `{ itemId?, conversationId?, activity: "writing" | "viewing" }` every 20s while a draft/story is open; `GET /presence` → active entries (TTL 45s) with user `{ id, displayName, color }`. In-memory store is fine (single instance); document the limitation.
- `GET /team` → users `{ id, displayName, color, role }` (color assigned deterministically).

## 2. Desktop board (`NewBoard`) — route `/board`
- Header: «سير العمل» (`t-hero` 30px) + «كل مسودات الفريق من الكتابة للنشر · مفيش اتنين بيكتبوا نفس الخبر»; online `avas` + «{n} أونلاين»; `seg` «الفريق | مسوداتي»; «مسودة من خبر» (AI → `/news`).
- `kanban` 4 columns `kcol` (مسودة · مراجعة · جاهز · اتنشر) with count badges; `kcard`: format `badge--ai`, assignee `ava`, title, live line «{name} بتكتب الآن» with `typing` dots (card gets `is-live`), meta (time / «مستني مراجعة {name}» / «فحص النشر ٦ من ٦» from S12 / published platforms), comments count when > 0.
- Move cards: native drag-and-drop between columns + a keyboard-accessible card menu («انقل إلى…»). Optimistic update with rollback on error.
- Card click → opens the draft. Rail item «سير العمل» and `G W` enabled.

## 3. Mobile (`MobNewQueue`) — reached from «المزيد» → «سير العمل»
`m-head` «سير العمل» + online avatars; status chips (مسودة/مراجعة/جاهز/اتنشر with counts); `m-list` rows (assignee `ava`, format badge, title, live typing line or time; live row tinted `--cyan-soft`); info `notice` explaining the duplicate-work warning.

## 4. Duplicate-work warning (studio)
When opening a story that someone else is `writing` (presence), show above the format deck: `notice--info` «{name} بتكتب عن «{headline}». لو كتبت عنه كمان هتكرروا الشغل.» + «افتح مسودتها» / «اكتب برضه».

## Acceptance
- [ ] Board and mobile queue match (light/dark); live presence updates within ~20s.
- [ ] Drag-and-drop and keyboard move both work; failed moves roll back.
- [ ] Duplicate-work notice appears when a teammate is writing the same story.
- [ ] `features.workflow = true`: rail item and «المزيد» row visible.
