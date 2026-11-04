# S13 · وضع العاجل + «اللي فاتك» + الموضوعات الصاعدة

> **الهدف:** لما يجي عاجل يبقى فيه ٣ صيغ جاهزة في ثواني ومعاها عدّاد من أول نشر. والصبح يبقى فيه ملخص للي فات بالليل، وموضوعات صاعدة محسوبة من العناوين نفسها. **محتاج endpointين جداد.**

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S13-breaking-digest.md exactly.
Reference boards: NewBreaking, MobNewBreaking, NewDigest, MobNewDigest. Backend first (section 1).
```

## 1. Backend
- `POST /news/breaking` `{ itemId }` → `{ post: string; ticker: string; alert: string; ms: number }` — one short JSON LLM call (post ≤ 280 chars starting «عاجل |», ticker one line starting «عاجل:», alert ≤ 80 chars). Counts toward `aiRateLimit`.
- `POST /news/digest` `{ since: string /* ISO */ }` → `{ items: { itemId: string; title: string; reason: string }[]; summaryText: string; sourceCount: number }` — top 3 items since `since`, each with a short reason label («الأهم اقتصادياً»، «الأكثر تحديثاً»، «متوقع يتفاعل عليه الجمهور»). Cache 10 minutes per `since` hour.
- Shared types + tests.

## 2. Breaking mode (`NewBreaking`, `MobNewBreaking`)
- Entry: «وضع العاجل» from the home breaking strip, from a breaking story panel (button next to the format deck title), and from the mobile breaking card. Route `/news?item={id}&breaking=1` (desktop) / `/news/{id}/breaking` (mobile).
- Top `breaking-bar`: «عاجل» badge, headline, timer «{mm:ss} من أول نشر» live from the item's first `publishedAt`.
- «وضع العاجل» + «المحرّر جهّز ٣ صيغ قصيرة في {s} ثوانٍ. انسخ وانشر، والتفاصيل تيجي بعدين.» + `badge--ai` «جاهز في {s} ث» (from `ms`).
- Three `panel`s with `arrive`: «منشور عاجل · X» («{n} / ٢٨٠» + tags), «شريط الأخبار» («سطر واحد»), «تنبيه للمتابعين» («{n} حرف»), each with «نسخ».
- Aside: «تابع القصة تلقائياً» switches — «حدّث الصيغ لما المصادر تضيف تفاصيل» (poll the item; when `sources.length` grows, re-call `/news/breaking` and re-animate) and «نبّه الفريق إن الخبر اتغطى» (render only when `features.workflow`; uses S15 presence). «التغطية لحد دلوقتي»: first source + time, confirming sources, and the teammate line when S15 is on. CTA «اكتب منشور مفصّل» → normal social flow.

## 3. «اللي فاتك» (`NewDigest`, `MobNewDigest`)
- Shown at the top of Home when the last visit was ≥ 6 hours ago (or 05:00–11:00 local with a new day). Title «اللي فاتك من {from} لـ {to}» (mobile «اللي فاتك بالليل»), «لخّصه المحرّر من {countPhrase(n, عنوان)} · تقرأه في {s} ثانية», «حدّث».
- Numbered list (Alexandria numerals) with title, «{sources} · {reason}», «اكتب عنه». Actions: «حوّله لموجز صباحي» (briefing with these `itemIds`, S04 extension) and «انسخ الملخص» (`summaryText`).
- The breaking strip stays under it, with the action renamed «وضع العاجل».

## 4. Trending topics (front-end only)
- From the feed: per topic, count items in 6 × 30-minute buckets over the last 3 hours → `spark` bars; label vs the previous 3 hours: ratio ≥ 2 → «↑ {n} أضعاف», > 1.15 → «↑», no previous items → «↑ جديد», else «ثابت».
- Insight line only when some ratio ≥ 2: «{topic} واخد {n} أضعاف عناوينه المعتادة النهارده. منشور تفسيري ممكن ينجح.»
- Desktop: panel «الموضوعات الصاعدة» + «من العناوين عندك», 4 rows. Mobile: «صاعد دلوقتي» horizontal `trend` cards.

## Acceptance
- [ ] Breaking and digest boards match (light/dark); timer runs live; three outputs appear with the arrive animation.
- [ ] Auto-update regenerates when a new source confirms the story.
- [ ] Digest appears only under the visit rule; trending numbers come from real feed data.
