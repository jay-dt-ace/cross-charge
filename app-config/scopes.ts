import { type OAuthScope } from "dt-app";

const GENERAL_APP_SCOPES = [
  {
    name: "app-engine:functions:run",
    comment: "Run functions in the analytics workflow",
  },
  { name: "app-engine:apps:run", comment: "Run functions" },
];

const APP_SETTINGS_SCOPES = [
  { name: "app-settings:objects:read", comment: "Read app settings" },
];

const AUTOMATION_WF_SCOPES = [
  {
    name: "automation:workflows:read",
    comment: "Needed to read the Workflows to find ingested workflow",
  },
];

const GRAIL_SCOPES = [
  {
    name: "storage:events:write",
    comment: "Allows for local ingestion of bizevents",
  },
  {
    name: "environment-api:entities:read",
    comment: "Get entity tags",
  },
  {
    name: "storage:entities:read",
    comment: "allows to query entities from Grail",
  },
  { name: "settings:objects:read", comment: "To get generic entity types" },
  { name: "environment-api:metrics:read", comment: "To read metrics" },
  {
    name: "storage:buckets:read",
    comment: "Allows the user to query records from Grail buckets",
  },
  {
    name: "storage:bizevents:read",
    comment: "Allows the user to query records from the bizevents table",
  },
];

export const APP_SCOPES: OAuthScope[] = [
  ...GENERAL_APP_SCOPES,
  ...APP_SETTINGS_SCOPES,
  ...AUTOMATION_WF_SCOPES,
  ...GRAIL_SCOPES,
];
