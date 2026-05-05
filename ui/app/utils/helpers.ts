import { type QueryStateType } from '@dynatrace/strato-components-preview/buttons';
import { convertToColumns } from '@dynatrace/strato-components-preview/tables';
import { getEnvironmentUrl } from '@dynatrace-sdk/app-environment';
import { type Metadata, type QueryResult, type RangedFieldTypes, type ResultRecord } from '@dynatrace-sdk/client-query';
import { isNull, isUndefined } from 'lodash-es';
import { APP_ID_BASE, SETTINGS_APP_ID } from '../constants/appIds';
import type { DataTableColumnDefinition } from '../Interfaces/Interfaces';

// Imported from @dynatrace-sdk/react-hooks/types/packages/util/react-hooks/src/lib/react-async-hook/react-async-hook
export type AsyncStateStatus = 'not-requested' | 'loading' | 'success' | 'error';

// gives meaningfull error messages
export const giveMeaningFullErrorMessage = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message;
  } else if (typeof err === 'string') {
    return err;
  }
  return 'An unexpected error occurred';
};

export const giveAppUrl = (appName: string) => {
  const tenantUrl = getEnvironmentUrl();
  return `${tenantUrl}/ui/apps/${appName}`;
};

export const giveSettingsLink = (connectionSchemaId: string) => {
  // Example URL
  // https://{tenantId}.apps.dynatrace.com/ui/apps/dynatrace.classic.settings/ui/settings/app:{appId}:{settings-schema-id}
  const appUrl = giveAppUrl(SETTINGS_APP_ID);
  return `${appUrl}/ui/settings/app:${APP_ID_BASE}:${connectionSchemaId}`;
};

export const giveDocumentLink = (documentID: string) => {
  // Example URL
  // https://{tenantId}.apps.dynatrace.com/ui/document/dynatrace.cross.charge.{documentID}
  return `${getEnvironmentUrl()}/ui/document/${APP_ID_BASE}.${documentID}`;
};

// extracts query data from query result
export const extractQueryDataFromQueryResult = (result: QueryResult | undefined) => {
  let emptyData = { metadata: {} as Metadata, records: [] as (ResultRecord | null)[], types: [] as RangedFieldTypes[] };

  if (isUndefined(result) || isNull(result.records)) {
    return emptyData;
  } else {
    emptyData = { ...result };
  }

  return emptyData;
};

// gives columns & data for dataTableV2
export const extractColumnsAndTableDataFroDataTableV2 = (result: QueryResult | undefined) => {
  const { metadata, records, types } = extractQueryDataFromQueryResult(result);

  const columns = convertToColumns(types);

  // make the column alignment to center
  const centerAlignmentColumns = columns.map((eachColumn) => ({
    ...eachColumn,
    alignment: 'center',
    width: 'content',
  })) as DataTableColumnDefinition<ResultRecord | null>[];

  return { metadata, records, types, columns: centerAlignmentColumns };
};

/** Get Query Status, Use this status in the RunQueryButton */
export const getQueryStatusForRunQueryButton = (queryStatus: AsyncStateStatus): QueryStateType => {
  if (queryStatus === 'error') {
    return 'error';
  } else if (queryStatus === 'loading') {
    return 'loading';
  } else if (queryStatus === 'success') {
    return 'success';
  }
  return 'idle';
};
