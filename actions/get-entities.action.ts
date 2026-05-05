import {
  UnsuccessfulActionError,
  userLogger,
} from "@dynatrace-sdk/automation-action-utils/actions";
import { queryExecutionClient } from "@dynatrace-sdk/client-query";
import { giveMeaningFullErrorMessage } from "../ui/app/utils/helpers";
import { getEntitiesSchema } from "../ui/shared/types/get-entities";

interface ActionResponseType {
  billing_metrics: string[];
  entity_ids: EntityInfoType[];
  entity_type: string;
}

interface EntityInfoType {
  name: string;
  id: string;
  tags: string[];
}

function findEntityType(rawPayload: unknown) {
  const payload = getEntitiesSchema.parse(rawPayload);
  let entityType = "";

  switch (payload.entityType) {
    case "serverless":
      entityType = "service";
      break;
    case "mainframe":
    case "full_stack":
    case "infra":
    case "foundation":
      entityType = "host";
      break;
    case "generic_entity":
    case "other":
      if (payload.otherType) {
        entityType = payload.otherType;
      } else {
        entityType = "";
      }
      break;
  }
  return entityType;
}

function buildDQL(rawPayload: unknown) {
  const payload = getEntitiesSchema.parse(rawPayload);
  let fetchEntityDQL = "fetch dt.entity.";
  let entityType = "";
  let monitoringMode = "";
  let osType = "";
  let serverlessFilter = "";
  let includePaasHosts = false;

  switch (payload.entityType) {
    case "serverless":
      entityType = "service";
      serverlessFilter =
        '| filter contains(toString(softwareTechnologies), "AWS_LAMBDA") OR contains(toString(softwareTechnologies), "AZURE_FUNCTIONS")';
      break;
    case "mainframe":
      entityType = "host";
      osType = "ZOS";
      break;
    case "full_stack":
      entityType = "host";
      monitoringMode = "FULL_STACK";
      includePaasHosts = true;
      break;
    case "infra":
      entityType = "host";
      monitoringMode = "INFRASTRUCTURE";
      break;
    case "foundation":
      entityType = "host";
      monitoringMode = "DISCOVERY";
      break;
    case "generic_entity":
    case "other":
      if (payload.otherType) {
        entityType = payload.otherType;
      } else {
        entityType = "";
      }
      break;
  }

  // userLogger.info(entity_type);
  // userLogger.info(monitoring_mode);

  fetchEntityDQL += entityType;

  if (monitoringMode !== "") {
    fetchEntityDQL += ' | filter monitoringMode == "' + monitoringMode + '" ';
  }
  if (includePaasHosts) {
    fetchEntityDQL += "or isNotNull(paasVendorType) ";
  }
  if (osType !== "") {
    fetchEntityDQL += '| filter osType == "' + osType + '"';
  }
  if (serverlessFilter !== "") {
    fetchEntityDQL += serverlessFilter;
  }

  fetchEntityDQL += "| fields entity.name, alias: name, id, tags";
  return fetchEntityDQL;
}

export default async (rawPayload: unknown) => {
  const payload = getEntitiesSchema.parse(rawPayload);
  const entities: EntityInfoType[] = [];
  let response = {} as ActionResponseType;

  if (!payload.entityType) {
    throw new UnsuccessfulActionError("Input field 'entity type' is missing.");
  }

  if (
    (payload.entityType === "other" ||
      payload.entityType === "generic_entity") &&
    !payload.otherType
  ) {
    throw new UnsuccessfulActionError(
      "Input field 'Other Entity Type' is missing.",
    );
  }

  if (!payload.billingMetrics) {
    throw new UnsuccessfulActionError(
      "Input field 'billing metrics' is missing.",
    );
  }

  const fetchEntityDQL = buildDQL(rawPayload);
  try {
    // Reference with limits for each parameter:
    // https://bitbucket.lab.dynatrace.org/projects/APPFW/repos/dynatrace-sdk/browse/packages/client/query/resources/spec.yaml
    const executeResponse = await queryExecutionClient.queryExecute({
      body: {
        query: fetchEntityDQL,
        requestTimeoutMilliseconds: 60000,
        maxResultRecords: 1000000,
        maxResultBytes: 104857600,
      },
    });

    if (executeResponse.result) {
      for (const record of executeResponse.result.records) {
        if (record?.name && record.id) {
          const entityRecord: EntityInfoType = {
            name: record.name as string,
            id: record.id as string,
            tags: record.tags ? (record.tags as string[]) : [],
          };
          entities.push(entityRecord);
        }
      }
    }
  } catch (error: unknown) {
    const message = giveMeaningFullErrorMessage(error);
    userLogger.error(message);
    throw new UnsuccessfulActionError(`Failed to Query entities: ${message}`);
  }

  const entityType = findEntityType(rawPayload);
  userLogger.warn(
    `In total ${entities.length} entities of type ${entityType} were retrieved`,
  );

  response = {
    billing_metrics: payload.billingMetrics.split(","),
    entity_ids: entities,
    entity_type: entityType,
  };

  return response;
};
