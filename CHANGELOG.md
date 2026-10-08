# Changelog

All notable changes to this project since the fork from `dynatrace.cross.charge`.

---

## [Unreleased]

### Fixed
- **Terminated host billing** — `get-entities` action now appends a time range clause (`from: "...", to: "..."`) to the DQL query when `from_time` and `to_time` are provided. Without this, `fetch dt.entity.*` only returns currently active entities, causing hosts that were terminated during the billing day to be silently excluded from cost calculations (`actions/get-entities.action.ts`, `ui/shared/types/get-entities.ts`)

### Changed
- **Event type** — bizevent `source` and `type` changed from `my.cross.charge` to `ace.vault.crosscharge` for consistency with existing queries and dashboards (`actions/get-billing-usage.action.ts`)
- **DQL query** — `event.provider` filter updated to `ace.vault.crosscharge` (`ui/app/constants/Queries.ts`)
- **Target environment** — `app.config.json` deployment target switched to GO UAT (`qve61453`)
- **gitignore** — added `/secrets.json` and `/settings/local-mock-data/secrets.json`

### Added
- `deploy/rollout.ps1` — PowerShell script for mass deployment across 30+ tenants; handles OAuth token, app install, bizevent settings, rate card settings, and workflow creation per tenant
- `deploy/workflow-template.json` — parameterised workflow definition with schedule trigger (5 PM daily, Australia/Sydney), `localIngest: false` on all send-bizevent tasks, and placeholder connection IDs
- `deploy/backfill.ps1` — PowerShell script to trigger workflow executions for historical dates across all tenants; patches `target_date` per date batch, checks execution status, and restores the workflow after completion
- `tenants.csv` — tenant registry (tenant_id, tenant_code, env, tag_key) used by deployment and backfill scripts

---

## [0.0.12] — Fork customisation for my.cross.charge deployment

### App identity
- Changed app ID from `dynatrace.cross.charge` to `my.cross.charge` (required for unsigned app deployment)
- Changed settings app ID to `dynatrace.settings.v2` for Gen3 tenants
- Removed `documents` section from `app.config.json` (unsigned apps cannot bundle documents)
- Moved `documents/` to `documents_backup/` to prevent `dt-app` from bundling the dashboard

### Environment detection
- SSO URL auto-detected at runtime via `getEnvironmentUrl()`:
  - Sprint → `sso-sprint.dynatracelabs.com`
  - Prod → `sso.dynatrace.com`
- Rate card API base URL auto-detected:
  - Sprint → `api-hardening.internal.dynatracelabs.com`
  - Prod → `api.dynatrace.com`

### Bug fixes
- **Rate card selection** — `findValidRateCard()` now picks the active contract with the most capabilities instead of last-wins iteration (fixes 4-capability addendum overriding the base contract)
- **Bizevent source/type** — corrected to `my.cross.charge` and DQL filter aligned
- **TextInput onChange handler** — fixed for Strato component API (passes `value` not DOM event)

### New features
- **Date range backfill** — new `get-date-range` action (step 1 of workflow):
  - Defaults to yesterday when `target_date` is blank
  - Accepts `target_date` (YYYY-MM-DD) to process any prior day without editing the workflow
  - New Zod schema `get-date-range.ts`
  - All 11 `get-billing-usage` tasks and `get_metric_bucket_usage` wired to `from_time`/`to_time` output

### Retry configuration
- `get_rate_card` — retry count 2, delay 30s
- All 11 entity-fetch tasks — retry count 2, delay 30s
- All 11 `send-bizevent` tasks — retry count 2, delay 30s, `failedLoopIterationsOnly: true`

### Observability
- Structured `[action-name]` prefixed logging added to all workflow actions:
  `get-rate-card`, `get-entities`, `get-entity-information`, `get-generic-entity-types`,
  `get-metric-bucket-usage`, `get-billing-usage`, `send-bizevent`, `get-date-range`

### Test infrastructure
- Added `jest.config.ts` with `ts-jest`, jsdom environment, and `lodash-es` mapper

### Files changed
`actions/get-billing-usage.action.ts`, `actions/get-date-range.action.ts` *(new)*,
`actions/get-date-range.widget.tsx` *(new)*, `actions/get-entities.action.ts`,
`actions/get-entity-information.action.ts`, `actions/get-generic-entity-types.action.ts`,
`actions/get-metric-bucket-usage.action.ts`, `actions/get-rate-card.action.ts`,
`actions/send-bizevent.action.ts`, `app.config.json`, `jest.config.ts` *(new)*,
`package.json`, `ui/app/constants/Queries.ts`, `ui/app/constants/appIds.ts`,
`ui/app/utils/helpers.ts`, `ui/shared/types/get-billing-usage.ts`,
`ui/shared/types/get-date-range.ts` *(new)*
