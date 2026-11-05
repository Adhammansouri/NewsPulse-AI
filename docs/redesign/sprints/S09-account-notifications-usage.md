# S09 · الإشعارات واستهلاك الذكاء الاصطناعي

> **الهدف:** صفحة الإشعارات بكل حالاتها، وأولهم «أول مرة» قبل ما المستخدم يفعّل. وصفحة الاستهلاك للأدمن بكل حالاتها: جاهز، وتحميل، وخطأ، وفترة مخصّصة، والحساب مش مربوط، ومش أدمن.

## Prompt to paste into Claude Code
```
Read docs/redesign/GLOBAL-RULES.md, then implement docs/redesign/sprints/S09-account-notifications-usage.md exactly.
Reference boards: DeskNotifications, DeskNotifications-off, MobNotif, MobNotif-off, MobNotif-blocked,
DeskUsage, DeskUsage-loading, DeskUsage-error, DeskUsage-custom, DeskUsage-setup, DeskUsage-forbidden, MobUsage, MobUsage-loading.
Keep usePushNotifications and the OpenAI usage service logic; only map their states to the designed UI.
```

## A. Notifications — `src/modules/Notifications`
**State mapping** (`usePushNotifications` UI status → board):
| Hook status | Desktop | Mobile |
|---|---|---|
| `idle` (permission `default`, not subscribed) | `DeskNotifications-off` | `MobNotif-off` |
| `subscribed` / `busy` with subscription | `DeskNotifications` | `MobNotif` |
| `blocked` | hero shows off + the «الإذن محظور في المتصفح» callout highlighted | `MobNotif-blocked` (numbered steps + «تحقّق تاني») |
| `ios_needs_install` | callout «على الآيفون: ثبّت التطبيق أولاً» highlighted | install sheet (`MobSystem-install`, S10) |
| `unsupported` | callout «المتصفح لا يدعم الإشعارات» | same notice in the hero area |
| `vapid_off` | callout «الخادم غير جاهز للإرسال» (`notice--error`) | same |

- Desktop layout: left column (hero card with switch, 2×2 status cells — `dt`/`dd` with colored dots, actions row: «أرسل إشعار تجربة» + result hint + «إيقاف على هذا الجهاز»), «شكل الإشعار» preview card; right column «لو ظهرت لك رسالة من دول» with the four callouts (the active one first).
- Off state: hero «الإشعارات مش مفعّلة» + device line «… · ما اتطلبش إذن لسه», cells (permission «ما اتطلبش لسه» warn dot, subscription «غير مشترك»), `ai-panel` benefits list + «فعّل الإشعارات» (ink) + hint «المتصفح هيطلب إذنك مرة واحدة».
- Device line: «{browser} على {OS} · فُعّلت {relative time}» — derive browser/OS from `navigator.userAgentData` / UA; store `subscribedAt` locally.
- Test push: keep `POST /push/test`; result hint «وصل إشعار التجربة قبل دقيقة» (ok) or `hint--error` on failure.

## B. Usage — `src/modules/Usage` (admin only; non-admins never reach it from nav, and a direct visit shows the forbidden state)
**State mapping** (`OpenAIDataStatus` + query state):
| Condition | Board |
|---|---|
| query loading (first load) | `DeskUsage-loading` / `MobUsage-loading` |
| network error / 5xx | `DeskUsage-error` |
| `ready` | `DeskUsage` / `MobUsage` |
| `not-configured`, `project-required` | `DeskUsage-setup` (steps: المحرّر متصل ✓ · أنشئ Admin API Key · أضفه في `OPENAI_ADMIN_KEY` · أعد تشغيل الـ API) |
| HTTP 403 / non-admin | `DeskUsage-forbidden` |
| `unauthorized`, `unavailable`, `not-found` | `DeskUsage-error` with the same layout and the existing status message as text |

- Header: «استهلاك الذكاء الاصطناعي» + live sync line; period `seg` (اليوم / ٧ أيام / ٣٠ يوماً / هذا الشهر / مخصّص), refresh icon, «تصدير CSV».
- Ready: KPI row (`ai-panel` cost hero with `meter` vs monthly limit; طلبات المحرّر; التوكنز + cached share; شرائح مرسومة), daily bar chart (today's bar in AI gradient; cost/tokens `seg`), models table, «أين يذهب الإنفاق؟» bars (text / images / web search) + note «الأرقام من حساب OpenAI وقد تشمل استخداماً خارج Newsplus.».
- Custom period (`DeskUsage-custom`): inline card under the header with «من»/«إلى» date fields, scope select (organization/project), «طبّق الفترة»; validation `hint--error` «تاريخ النهاية قبل تاريخ البداية. الأيام بتوقيت UTC والحد الأقصى ٩٠ يوم.» with the apply button disabled. Keep the existing date-range rules from `usageFormat.ts` (if the max range differs from 90, use the code's value in the message).
- All amounts LTR (`$18.42`), counts in Arabic digits.

## Acceptance
- [ ] Every notifications/usage board matches (light/dark); each hook/API status lands on the right board.
- [ ] «فعّل الإشعارات» requests permission and subscribes; test push shows the result hint.
- [ ] Custom range validation blocks invalid ranges; CSV export still works.
- [ ] Old `usage.css` and notifications CSS removed.
