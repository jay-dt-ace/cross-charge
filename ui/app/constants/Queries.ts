/**
 * DQL Queries
 */
export const bizEventsInitialQuery = "fetch bizevents";

export const bizEventsQueryWithTimeframe = `fetch bizevents, from: now()-1d
| filter matchesValue(event.provider, "my.cross.charge")
| dedup {formatTimestamp(timestamp, format:"MM-dd-yyyy"), billedEntityId, module }, sort: { timestamp desc }
`;
