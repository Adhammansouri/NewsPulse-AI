# S03 · تسجيل الدخول (عربي وEnglish وكل الحالات)

> **الهدف:** شاشة الدخول الجديدة بكل حالاتها: الحقول الفاضية، والبيانات الغلط، والسيرفر مش متاح، والمحاولات الكتير، ونسيت كلمة المرور بشكل صادق، والنسخة الإنجليزي من اليسار لليمين.

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S03-login.md exactly.
Reference boards: DeskLogin (interactive) + DeskLogin-validation/-error/-network/-locked/-forgot/-english,
MobLogin + MobLogin-validation/-error/-network/-locked/-forgot/-english.
This sprint includes one small backend change (section 4).
```

## Boards
Desktop: `DeskLogin` (interactive: first «دخول» = error, second = success), `DeskLogin-validation`, `-error`, `-network`, `-locked`, `-forgot`, `-english`.
Mobile: `MobLogin` and the same six states. All copy (AR **and** EN) is in `DeskLogin.dc.html` / `MobLogin.dc.html` → `AR` / `EN` objects in `renderVals()`.

## 1. Layout
- Desktop: two halves — form side (`main`) + navy brand side (`aside`, radial gradients, hero line, pulse line, the 3-row "wire" preview). In RTL the form is on the right; in English (LTR) it flips to the left automatically.
- Mobile: top bar (logo, theme, language) → navy hero card with pulse line → title/subtitle → fields → «تذكّرني» + «نسيت كلمة المرور؟» → bottom CTA in `m-cta`.
- The brand-side "wire" rows are **decorative sample text**, part of the design — keep them as static copy (AR and EN variants from the reference). This is the only sample text allowed to ship.

## 2. Copy & i18n
- Replace `src/modules/Login/copy.ts` with the `AR` and `EN` dictionaries from the reference (same keys). Keep the existing language toggle and persist it as today.
- `dir`/`lang` on the login root follow the language; English uses IBM Plex Sans for UI and headings (as in the reference).

## 3. States & logic
| State | Trigger | UI |
|---|---|---|
| validation | submit with empty identifier/password (client-side) | both fields `is-error`, hint under each (`idRequired`, `pwRequired`), no request sent |
| error | API 401 / invalid credentials | `notice--error` with `invalid` copy; fields `is-error`; the «باقي N محاولات» sentence only when the API returns remaining attempts (§4) and N ≤ 5 |
| network | fetch fails / 5xx / timeout | `notice--warn` with `network` copy (wifi-off icon) |
| locked | API 429 | `notice--warn` with `locked` copy; submit disabled showing «استنى m:ss» countdown; hint «تقدر تحاول تاني بعد m:ss»; auto re-enable at 0 |
| loading | request in flight | button shows small `PulseLine` + «جاري الدخول…», disabled |
| success | 200 | button shows check + «أهلاً {displayName}» for 600ms, then navigate |
| forgot | «نسيت كلمة المرور؟» | **honest flow**: no email is sent by the backend today, so show the admin-contact view (lock icon, title, text, admin card, «راسل المسؤول» = `mailto:` from `VITE_ADMIN_EMAIL`, «رجوع لتسجيل الدخول»). Do **not** call `/auth/forgot-password` and do not claim an email was sent. |

Remove the dev-credentials hint from the UI entirely.

## 4. Backend (small)
`newsplus-API/src/middleware/loginRateLimit.ts`:
- Set `X-RateLimit-Remaining` (MAX_ATTEMPTS − count, min 0) on every login response, and `Retry-After` (seconds until `resetAt`) on 429.
- Keep the production-only behavior and the existing test passing; add a test for the headers.
Frontend reads both headers (expose them via CORS `exposedHeaders` if the API is cross-origin).

## Acceptance
- [ ] All 7 desktop and 7 mobile login boards match (light/dark).
- [ ] Switching to English flips layout to LTR and uses the EN copy everywhere on the page.
- [ ] No request on empty submit; 401/429/network each show their designed state; countdown re-enables the button.
- [ ] Forgot-password never claims an email was sent.
- [ ] Remember-me behavior unchanged (localStorage vs sessionStorage).
- [ ] Old `login.css` deleted.
