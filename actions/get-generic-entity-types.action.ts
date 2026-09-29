import {
  UnsuccessfulActionError,
  userLogger,
} from "@dynatrace-sdk/automation-action-utils/actions";
import { settingsObjectsClient } from "@dynatrace-sdk/client-classic-environment-v2";
import { giveMeaningFullErrorMessage } from "../ui/app/utils/helpers";

interface GenericType {
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async (_rawPayload: unknown) => {
  const entityTypes: string[] = [];

  userLogger.info(`[get-generic-entity-types] Fetching generic entity types from settings`);
  try {
    const data = await settingsObjectsClient.getSettingsObjects({
      schemaIds: "builtin:monitoredentities.generic.type",
      pageSize: 500,
      fields: "value",
    });

    for (const item of data.items) {
      if (item.value) {
        const type = item.value as GenericType;
        entityTypes.push(type.name);
      }
    }
    userLogger.info(`[get-generic-entity-types] Found ${entityTypes.length} generic entity types: ${entityTypes.join(', ')}`);
  } catch (error: unknown) {
    const message = giveMeaningFullErrorMessage(error);
    userLogger.error(`[get-generic-entity-types] Error: ${message}`);
    throw new UnsuccessfulActionError(`Failed to fetch settings: ${message}`);
  }

  return entityTypes;
};
