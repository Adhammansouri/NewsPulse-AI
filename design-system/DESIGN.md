# Superseded — see `docs/redesign/`

The Newsplus front end follows the **Pulse** redesign. Its single source of truth is
[`docs/redesign/`](../docs/redesign/README.md):

- [`GLOBAL-RULES.md`](../docs/redesign/GLOBAL-RULES.md): mandatory rules for any UI work (copy, Arabic numerals, RTL, sizes, "done").
- `design/screens/`: the approved boards (desktop 1440×900, mobile 390×844) to match exactly.
- `design/reference/`: each board's HTML (structure, copy, states). `design/css/`: the design CSS, ported as-is to `newsplus-front/src/styles/design/`.
- `qa-tools/`: screenshots of the app to compare with the boards.

The earlier hybrid system (Newsplus brand shell + Nothing tools, `brand-*` / `nd-*` classes, `tokens.css`, Tailwind)
was removed from the app in S10. Do not reintroduce it.
