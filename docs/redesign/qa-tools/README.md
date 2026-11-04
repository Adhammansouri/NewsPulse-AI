# QA tools · مقارنة التنفيذ بالتصميم

## Setup (once)
```bash
npm i -D playwright -w newsplus-front
npx playwright install chromium
```

## Run
1. Start the front-end: `npm run dev -w newsplus-front` (http://localhost:5173). The API is **mocked** by the script, so the backend is not needed.
2. Capture the sprint: `node docs/redesign/qa-tools/shots.mjs S04`
3. Open `docs/redesign/qa/S04/` and compare each shot with the boards listed for the sprint in `docs/redesign/design/BOARD-INDEX.md` (`design/screens/<Board>.jpg`).

States that can't be reached through a route (loading, errors, sheets, toasts) are verified by temporarily forcing the state in the component (e.g. a `?qa=loading` query read **only in dev**), capturing, then removing the override. Never ship QA overrides.

`fixtures.mjs` is the same sample data used to draw the design. It is QA-only — never import it from `src/`.
