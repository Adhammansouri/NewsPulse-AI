# OpenAI usage dashboard

Open `/usage` (navigation: **استهلاك AI**). The configured workspace seed account and users with the `admin` role may read account usage. The server checks the current user record; ordinary editors receive 403. Existing accounts, IDs and login behavior are preserved.

## Connect an account

1. Create an Admin API key in [OpenAI organization settings](https://platform.openai.com/settings/organization/admin-keys).
2. Set `OPENAI_ADMIN_KEY` in the API server environment. Keep `OPENAI_API_KEY` for generation; administration uses a separate SDK client.
3. Optionally set `OPENAI_PROJECT_ID=proj_…` to scope the initial view to a project. Otherwise the initial view includes the entire organization.
4. Restart the API. Select a project on the page to view project rate limits and its monthly spend limit.

Never set these secrets as `VITE_*` variables or send them to a browser. No key entry/storage is provided in the frontend. On the VPS add the variables to `/opt/newsplus/.env`, which is already passed to the container by `env_file`, then recreate the app container. Hostinger Node hosting uses the API server environment. This change does not deploy or configure credentials.

## Data and behavior

`GET /api/openai/usage?start=YYYY-MM-DD&end=YYYY-MM-DD&project=proj_…` returns the standard `{status:"success",data:…}` envelope. Dates are inclusive UTC calendar days, maximum 90 days, with future dates rejected. `project=organization` explicitly selects the organization; omitting it uses the configured default. All upstream operations are read-only.

The page reads the official organization Usage and Costs APIs, projects, spend limits and project rate limits. It follows pagination and exposes each section's status independently. Available usage categories include text/completions, images, embeddings, moderations, speech, transcription, vector storage, code interpreter, file search and web search. Metric names not yet translated remain visible by their official names. CSV includes all received usage metrics, dimensions and cost line items for the selected range.

- Costs come from the Costs API, not token-price estimates. Costs are grouped by billing line item and project; no per-model costs are inferred. Amounts from Costs are currency units; spend-limit thresholds are cents and converted once.
- Monthly spend meters always use current calendar-month costs from the same scope as the limit, independent of the selected date range. Organization and project limits are separate.
- Cached input is included in input tokens and is never added again to total tokens.
- Rate-limit values describe configured throughput limits, not remaining requests right now. There is no inferred daily monetary quota. Remaining spend before a limit is not prepaid credit balance.
- Missing permissions, unsupported endpoints, missing limits and absent admin configuration display unknown values, never fake zero balances. Successful empty usage responses represent no recorded usage.
- Prepaid credit balance and the account's OpenAI-assigned usage tier/approved limit are linked to OpenAI settings rather than scraped from undocumented billing APIs.
- OpenAI aggregation may lag current requests. The page shows its fetch timestamp, uses a bounded in-memory 60-second cache with request deduplication, and refetches every 5 minutes while open. Authenticated responses use `Cache-Control: no-store`; the existing service worker uses network-only API handling.

## Validation

Run `npm run typecheck`, `npm test`, and `npm run build`. Backend tests use mocked OpenAI HTTP responses for authentication, permissions, pagination, cents conversion, scope isolation, missing credentials, rate limits and failures. Frontend checks verify UTC periods, daily gap filling, cached-token accounting and currency handling. Live account verification requires a configured Admin API key.

Browser acceptance: start `npm run dev`, open `http://localhost:5180/usage` with `npx --yes @playwright/cli -s=openai-usage open http://localhost:5180/usage`, and sign in using the workspace account. Run `npx --yes @playwright/cli -s=openai-usage run-code --filename=newsplus-front/scripts/check-openai-usage-browser.cjs`. This uses clearly isolated mocked network responses for layout and interactions; screenshots and CSV are local ignored artifacts under `.playwright-cli/`. It removes the mock and reloads the real page after success.

Verified locally: the real API shows the missing-admin-key setup state. Mocked connected data passed desktop/tablet/mobile layouts (1440, 768, 390, 360 px), both themes, checks for clipped sections, chart day selection, CSV download, UTC today selection and organization/project spend separation, with no JavaScript runtime errors. The actual OpenAI account has not been queried because no Admin API key is configured.

Official references: [Admin APIs](https://developers.openai.com/api/docs/guides/admin-apis), [Usage API](https://developers.openai.com/api/reference/python/resources/admin/subresources/organization/subresources/usage), [Spend limits](https://developers.openai.com/api/docs/guides/spend-limits).
