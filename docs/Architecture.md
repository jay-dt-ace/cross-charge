# Cross-Charge App — High-Level Design

## Overview

Cross-Charge is a Dynatrace platform application that attributes DPS (Dynatrace Platform Subscription) licensing costs to individual departments, teams, or customers based on tags assigned to monitored entities. It automates the full pipeline: from fetching rate card pricing and querying entity usage metrics, to calculating per-entity costs and emitting them as business events for reporting.

**Primary use cases:**

- Attribute licensing costs to internal departments based on a cost-center tag on each entity.
- In shared environments (e.g. integrators hosting multiple customers), determine which customer consumed how much licensing.

---

## Tech Stack

| Layer                | Technology                                                      |
| -------------------- | --------------------------------------------------------------- |
| UI framework         | React 18 + TypeScript 5.9                                       |
| UI component library | Dynatrace Strato Design System                                  |
| Routing              | React Router DOM v7                                             |
| Workflow automation  | Dynatrace Automation (Workflows)                                |
| Action runtime       | Node.js TypeScript via `@dynatrace-sdk/automation-action-utils` |
| Data querying        | Dynatrace Query Language (DQL)                                  |
| Event format         | CloudEvents standard                                            |

---

## System Architecture

The application is composed of four loosely coupled parts:

```
┌─────────────────────────────────────────────────────┐
│                  Dynatrace App (UI)                  │
│  - Workflow install button                           │
│  - App settings links                               │
│  - Dashboard link                                   │
│  - DQL Query Tab                                    │
└───────────────┬─────────────────────────────────────┘
                │ triggers / reads
┌───────────────▼─────────────────────────────────────┐
│           Dynatrace Workflow (Automation)            │
│  - 56+ orchestrated tasks running daily             │
│  - Parallel execution per entity type               │
│  - Calls 7 workflow actions                         │
└───────────────┬─────────────────────────────────────┘
                │ executes
┌───────────────▼─────────────────────────────────────┐
│              Workflow Actions (7 actions)            │
│  - Fetch rate card                                  │
│  - Query entities + tags                            │
│  - Calculate billing usage                          │
│  - Emit bizevents                                   │
└───────────────┬─────────────────────────────────────┘
                │ stores results as
┌───────────────▼─────────────────────────────────────┐
│         Dynatrace Grail (bizevents table)            │
│  - Queryable via DQL                                │
│  - Visualized by Gen3 dashboard                     │
└─────────────────────────────────────────────────────┘
```

---

## Components

### 1. Dynatrace App (UI)

The React app runs inside the Dynatrace platform and serves as the control surface for initial setup and data exploration.

**Home page** — `/`

- **Install Workflow button**: Opens the Dynatrace Automations app via `sendIntent` to create the Cross-Charge workflow. On subsequent visits, the app queries the live Dynatrace Automation workflows list (`workflowsClient.getWorkflows()`) to detect whether a workflow titled "Cross Charge" already exists — if found, the install button is replaced with a direct link to that workflow. No app state is persisted.
- **App Settings links**: Shortcuts to the two configuration objects the workflow needs (see App Settings section below).
- **Dashboard link**: Opens the Cross-Charge-Reporting Gen3 dashboard.
- **Permission check**: The install button is only enabled if the user holds all required OAuth scopes. A warning is shown otherwise.

**DQL Query Tab** — `/query`

- An in-app DQL editor pre-loaded with a query that retrieves all Cross-Charge bizevents from the last day.
- Results are rendered in a dynamic data table with auto-detected columns.
- Users can modify and re-run the query directly within the app to explore cost allocation data without leaving the UI.

---

### 2. App Settings

Two configuration objects are stored in the Dynatrace App Settings service and read by the workflow actions at runtime.

#### `get-rate-card-connection`

Controls how the rate card (pricing) is sourced and which tag keys are used for cost attribution.

| Field            | Description                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `rate_card_type` | `"account"` to fetch live pricing from the Dynatrace Accounts API, or `"default"` to use published list prices from dynatrace.com/pricing |
| `client_id`      | OAuth2 client ID for the Accounts API (required when type is `"account"`)                                                                 |
| `client_secret`  | OAuth2 client secret                                                                                                                      |
| `account_id`     | Dynatrace account ID                                                                                                                      |
| `tag_keys`       | Array of `{ tag_key, tag_alias }` — defines which entity tags represent cost centers and their display aliases                            |

#### `send-bizevent-connection`

Optional. Configures remote ingest so bizevents can be forwarded to a second Dynatrace environment (e.g. a central reporting environment separate from the monitored one).

| Field   | Description                                |
| ------- | ------------------------------------------ |
| `url`   | Target Dynatrace tenant URL                |
| `token` | API token with bizevents ingest permission |

---

### 3. Workflow Actions (Backend)

Seven TypeScript actions run as serverless steps inside the Dynatrace Workflow. They are independent, composable units — each receives typed input and returns typed output.

#### `get-rate-card`

Fetches capability pricing from the Dynatrace Accounts API using OAuth2 credentials from app settings. In `"default"` mode, returns hardcoded list prices. Validates that the current date falls within the rate card's active period. Returns a map of capability key → price.

#### `get-entities`

Queries Dynatrace for monitored entities of a specific type (e.g. full-stack hosts, RUM apps, synthetic tests) using DQL. Supports all major entity types:

- Full-stack hosts, infrastructure hosts, foundation hosts, mainframe hosts
- RUM web apps, mobile apps, custom apps
- Synthetic browser, HTTP, and 3rd-party monitors
- Kubernetes namespaces
- Serverless services
- Custom/generic entity types (configurable)

Returns entity IDs, names, and raw tags.

#### `get-entity-information`

Normalizes entity tags against the configured `tag_keys`. For each entity, maps tag key → value, substituting `"unknown"` when a configured tag key is absent on that entity. This ensures every bizevent has a consistent set of dimension fields regardless of tagging completeness.

#### `get-metric-bucket-usage`

For full-stack and infrastructure hosts, calculates what percentage of their included host unit metrics were actually billed (vs. consumed within the free bucket). This percentage is used downstream to pro-rate billing costs for those host types.

#### `get-billing-usage`

The core cost calculation step. For each entity:

1. Queries the Dynatrace Metrics API for actual consumption of the previous day's billing metrics.
2. Multiplies consumption by the rate card price for that capability.
3. Constructs a CloudEvent (bizevent) containing:
   - Entity ID, name, and all normalized tag dimensions
   - Capability, consumption quantity, unit, and calculated cost
   - Currency code and billing period (start/end timestamps)
   - Source: `dynatrace.cross.charge`

#### `send-bizevent`

Ingests the CloudEvents produced by `get-billing-usage` into Dynatrace. Two modes:

- **Local**: Ingests into the current tenant (default).
- **Remote**: Forwards to the tenant configured in `send-bizevent-connection` app settings — useful for centralizing cost data from multiple monitored environments.

#### `get-generic-entity-types`

Reads custom/generic entity type definitions from app settings. Allows the workflow to cover entity types beyond the built-in set without code changes.

---

### 4. Workflow Orchestration

The Cross-Charge Workflow is a pre-built automation document installed by the UI. It contains 56+ tasks and runs on a daily schedule.

**Execution pattern:**

1. `get-rate-card` runs once as the entry point.
2. `get-metric-bucket-usage` runs in parallel to produce host unit percentages.
3. For each of ~10 entity types, a chain of three tasks runs in parallel across entity types:
   - `get-entities` → `get-entity-information` → `get-billing-usage` → `send-bizevent`
4. All bizevents from all entity types are ingested at the end.

**Concurrency and reliability settings:**

- Entity info gathering: concurrency 75
- Billing and send steps: concurrency 10
- Retries: 2 per task with exponential backoff
- Task timeout: 1800 seconds

---

### 5. Gen3 Dashboard

A pre-built Dynatrace Gen3 dashboard document (`/ui/documents/`) that is imported into the environment alongside the app. It provides out-of-the-box visualizations of the bizevents data including:

- Cost breakdown by module / entity type
- Cost breakdown by cost center (tag dimension)
- Trend over time

The dashboard queries the `bizevents` table filtered by `source == "dynatrace.cross.charge"`.

---

## Data Flow

```
Daily schedule trigger
        │
        ▼
get-rate-card ──────────────────────────────────────┐
        │                                            │
        ▼                                            │
get-metric-bucket-usage                              │ rate card
        │                                            │ passed to all
        ▼ (per entity type, in parallel)             │ billing steps
get-entities                                         │
        │                                            │
        ▼                                            │
get-entity-information (tag normalization)           │
        │                                            │
        ▼                                            │
get-billing-usage ◄──────────────────────────────────┘
  (usage × rate = cost → CloudEvent)
        │
        ▼
send-bizevent
  (local tenant and/or remote tenant)
        │
        ▼
Grail bizevents table
        │
        ├──► DQL Query Tab (in-app exploration)
        └──► Gen3 Dashboard (reporting)
```

---

## Required OAuth Scopes

The app checks these scopes before allowing workflow installation. The workflow actions also require them at execution time.

| Scope                            | Purpose                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| `app-engine:functions:run`       | Run action functions inside the analytics workflow              |
| `app-engine:apps:run`            | Run the app itself within the Dynatrace platform                |
| `app-settings:objects:read`      | Read rate card and bizevent connection configs                  |
| `automation:workflows:read`      | Query the live workflows list to detect an existing installation |
| `storage:events:write`           | Ingest bizevents locally into the current tenant                |
| `storage:entities:read`          | Query entities via DQL from Grail                               |
| `storage:buckets:read`           | Read metric bucket data from Grail                              |
| `storage:bizevents:read`         | Query emitted bizevents in the DQL Query Tab                    |
| `settings:objects:read`          | Read generic entity type definitions                            |
| `environment-api:metrics:read`   | Fetch billing usage metrics                                     |
| `environment-api:entities:read`  | Read entity metadata and tags                                   |

---
