# Cross-Charge

A [Dynatrace App](https://developer.dynatrace.com) that attributes Dynatrace Platform Subscription (DPS) licensing costs to individual departments, teams, or customers based on tags assigned to monitored entities — enabling automated cost chargeback across shared or multi-team environments.

---

## What It Does

Cross-Charge automates the full DPS cost attribution pipeline inside Dynatrace:

1. **Fetch pricing** — pulls your account's rate card from the Dynatrace Accounts API (or uses published list prices as a fallback).
2. **Query entities** — discovers monitored entities across all supported types: full-stack/infra/foundation/mainframe hosts, RUM apps, synthetic tests, Kubernetes namespaces, serverless services, and custom generic entity types.
3. **Normalize tags** — maps configurable cost-center tag keys onto each entity, substituting `"unknown"` for any entity missing a tag so every record has consistent dimensions.
4. **Calculate costs** — multiplies each entity's previous-day billing metric consumption by its rate card price to produce a per-entity cost figure.
5. **Emit bizevents** — writes the results as CloudEvents to the Dynatrace Grail `bizevents` table, optionally forwarding them to a second environment for centralized reporting.
6. **Visualize** — a bundled Gen3 dashboard and an in-app DQL Query Tab let you explore cost breakdowns by entity type, cost center, or any tag dimension.

---

## Getting Started

### Prerequisites

- **Node.js** `>=22`
- Access to a **Dynatrace tenant** with:
  - All OAuth scopes listed in the [Design Document](docs/NewDesign.md#required-oauth-scopes)

### Install

```bash
npm install
```

### Run Locally

You do not need to deploy the app to use it. Running it locally connects to whichever Dynatrace tenant is configured in `app.config.json`.

```bash
npm run start
```

This opens the app in your browser with hot reload enabled. All data is fetched live from your configured Dynatrace environment.

### Deploy to Dynatrace

```bash
npm run deploy
```

Builds and deploys the app directly to the environment URL in `app.config.json`.

---

## Configuration

All configuration lives in **`app.config.json`** at the project root. There are no `.env` files — the Dynatrace SDK handles auth context.

Update `environmentUrl` to point at your own tenant before running or deploying.

> If any required OAuth scope is missing, the workflow install button is disabled and a warning is shown. The rest of the app (dashboard link, settings links, DQL Query Tab) remains fully accessible.

---

## Architecture & Design

For a full breakdown of the architecture, all seven workflow actions, the end-to-end data flow, required OAuth scopes, and key file locations, see the **[Design Document](docs/Architecture.md)**.

---

## Routes

The app is served under the base path `/ui`.

| Route       | Page                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| `/ui/`      | **Home** — install the Cross-Charge workflow, configure app settings, open the reporting dashboard    |
| `/ui/query` | **DQL Query Tab** — run and modify DQL queries against Cross-Charge bizevents in the Grail data store |

---

## Tech Stack

| Layer                 | Technology                                   |
| --------------------- | -------------------------------------------- |
| Framework             | React 18, React Router 7                     |
| Language              | TypeScript 5.9                               |
| State & Data Fetching | Dynatrace SDK React Hooks, SDK Clients       |
| UI Components         | Dynatrace Strato Components + Design Tokens  |
| Build Tool            | Dynatrace App Toolkit (`dt-app`)             |
| i18n                  | React-Intl                                   |
| Backend               | Dynatrace SDK clients (no standalone server) |

---

## Limitations

- **Platform-locked** — the app runs inside the Dynatrace browser shell. It cannot be deployed as a standalone web server.
- **Permission-gated install** — the workflow install button is disabled and a warning is displayed if any required OAuth scope is missing. The rest of the UI remains accessible.
- **Node.js `>=16.13.0`** is required for local development.

---

> **This repository is archived and is no longer maintained.**
>
> No bug fixes, feature updates, or pull requests will be accepted. The code is provided as-is for reference only. For supported Dynatrace app development resources, visit the [Dynatrace Developer Portal](https://developer.dynatrace.com).
