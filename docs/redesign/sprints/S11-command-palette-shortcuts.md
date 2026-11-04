# S11 · لوحة الأوامر Ctrl+K واختصارات الكيبورد (فرونت بس)

> **الهدف:** الصحفي يقدر يوصل من العاجل لمنشور منسوخ من غير ما يلمس الماوس.

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S11-command-palette-shortcuts.md exactly.
Reference boards: NewCmdK, NewShortcuts. Front-end only.
```

## 1. `useHotkeys` — `src/hooks/useHotkeys.ts`
Global key handling, desktop only (≥1024). Ignored while focus is in `input`/`textarea`/`[contenteditable]`, **except** `Esc`, `Ctrl/⌘+K`, `Ctrl/⌘+Enter`.

| Keys | Action |
|---|---|
| `Ctrl/⌘ K` | open command palette |
| `/` | focus wire search |
| `?` | open shortcuts sheet |
| `Shift D` | toggle dark mode |
| `J` / `K` | next / previous headline (selects + scrolls into view) |
| `Enter` | open selected headline |
| `B` | «موجز الساعة» |
| `1`–`5` | time filter (الكل … اليوم) |
| `F` then `1`–`7` | choose format in deck order (منشور، فيديو، كاروسيل، مكتبي، نشرة، حقائق، سياق) |
| `Ctrl/⌘ Enter` | generate with the selected format |
| `C` | copy all (draft open) |
| `P` | publish check (S12, when enabled) |
| `G` then `H`/`N`/`W`/`A` | go to Home / News / Workflow (S15) / Archive |

Sequences (`F 1`, `G H`) time out after 1s.

## 2. Command palette (`NewCmdK`) — `src/components/shell/CommandPalette.tsx`
- `scrim` + `palette` (centered, top 84px, 680px max). Input row: search icon (cyan), query, `Esc` key.
- Groups (`palette__label`): **«أفعال بالمحرّر»** (AI `ic-wrap`): «اكتب منشور سوشيال عن {query}» (`↵`, uses the selected story if the query matches it, else creates from the query text), «سكريبت فيديو عن …» (`Ctrl ↵`), «موجز الساعة» (`B`). **«عناوين»**: feed items and drafts whose titles match (highlight with `<mark>`), meta «{source} · {time} · عاجل» / «مسودة · {format} · {time}». **«انتقال»**: pages with their `G` shortcuts.
- Keyboard: `↑`/`↓` move `aria-selected`, `↵` runs, `Esc` closes. Mouse hover selects. `role="listbox"`/`option`.
- Footer: «↑ ↓ للتنقل · ↵ للتنفيذ · ? كل الاختصارات». **Key combos render `dir="ltr"`.**
- Empty query shows the three groups with recent items; no matches → «مفيش نتائج لـ «{query}»» in `t-meta`.

## 3. Shortcuts sheet (`NewShortcuts`)
`popover` dialog (880px), header (keyboard `ic-wrap`, «اختصارات الكيبورد», «اقفل Esc»), 4 groups in a 2-column grid exactly as the board (في كل مكان · العناوين · الكتابة · التنقل), footer tip line. Opened by `?` and by the rail keyboard button (`features.shortcuts = true`).

## Acceptance
- [ ] Palette and sheet match their boards (light/dark), combos LTR.
- [ ] All shortcuts work and never fire while typing.
- [ ] Full keyboard path works: `J` → `F 1` → `Ctrl ↵` → `C`.
