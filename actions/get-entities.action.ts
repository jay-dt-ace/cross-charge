import {
  UnsuccessfulActionError,
  userLogger,
} from "@dynatrace-sdk/automation-action-utils/actions";
import { metricsClient } from "@dynatrace-sdk/client-classic-environment-v2";
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

  // Include time range so terminated hosts (alive during the billing day) are returned.
  // Without from/to, DQL only returns currently active entities.
  const timeClause = (payload.from_time && payload.to_time)
    ? `, from: "${payload.from_time}", to: "${payload.to_time}"`
    : "";

  let fetchEntityDQL = `fetch dt.entity.`;
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

  fetchEntityDQL += entityType + timeClause;

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

  userLogger.info(`[get-entities] entityType: ${payload.entityType}, otherType: ${payload.otherType ?? 'n/a'}`);

  try {
    if (payload.entityType === "full_stack") {
      // Metric-first approach: query billing metric to get accurate historical host list.
      // DQL monitoringMode filter uses current state and misses terminated hosts;
      // the billing metric is the source of truth for which hosts were actually billed.
      const metricResult = await metricsClient.query({
        acceptType: "application/json; charset=utf-8",
        metricSelector: 'builtin:billing.full_stack_monitoring.usage_per_host:splitBy("dt.entity.host")',
        resolution: "inf",
        from: payload.from_time,
        to: payload.to_time,
      });

      const billedHostIds = (metricResult.result?.[0]?.data ?? [])
        .filter(d => (d.values?.[0] ?? 0) > 0)
        .map(d => d.dimensionMap?.["dt.entity.host"] as string)
        .filter(Boolean);

      userLogger.info(`[get-entities] Metric-first fullstack: ${billedHostIds.length} billed hosts`);

      if (billedHostIds.length > 0) {
        const idList = billedHostIds.map(id => `"${id}"`).join(",");
        const timeClause = (payload.from_time && payload.to_time)
          ? `, from: "${payload.from_time}", to: "${payload.to_time}"`
          : "";
        const lookupDQL = `fetch dt.entity.host${timeClause} | filter in(id, array(${idList})) | fields entity.name, alias: name, id, tags`;
        userLogger.info(`[get-entities] Tag lookup DQL for ${billedHostIds.length} hosts`);

        const lookupResp = await queryExecutionClient.queryExecute({
          body: {
            query: lookupDQL,
            requestTimeoutMilliseconds: 60000,
            maxResultRecords: 1000000,
            maxResultBytes: 104857600,
            defaultTimeframeStart: payload.from_time,
            defaultTimeframeEnd: payload.to_time,
          },
        });

        if (lookupResp.result) {
          for (const record of lookupResp.result.records) {
            if (record?.name && record.id) {
              entities.push({
                name: record.name as string,
                id: record.id as string,
                tags: record.tags ? (record.tags as string[]) : [],
              });
            }
          }
        }
        userLogger.info(`[get-entities] Tag lookup resolved ${entities.length} of ${billedHostIds.length} hosts`);
      }
    } else {
      // Existing DQL approach for all other entity types
      const fetchEntityDQL = buildDQL(rawPayload);
      userLogger.info(`[get-entities] DQL: ${fetchEntityDQL}`);
      // Reference with limits for each parameter:
      // https://bitbucket.lab.dynatrace.org/projects/APPFW/repos/dynatrace-sdk/browse/packages/client/query/resources/spec.yaml
      const executeResponse = await queryExecutionClient.queryExecute({
        body: {
          query: fetchEntityDQL,
          requestTimeoutMilliseconds: 60000,
          maxResultRecords: 1000000,
          maxResultBytes: 104857600,
          defaultTimeframeStart: payload.from_time,
          defaultTimeframeEnd: payload.to_time,
        },
      });

      if (executeResponse.result) {
        for (const record of executeResponse.result.records) {
          if (record?.name && record.id) {
            entities.push({
              name: record.name as string,
              id: record.id as string,
              tags: record.tags ? (record.tags as string[]) : [],
            });
          }
        }
      }
    }
  } catch (error: unknown) {
    const message = giveMeaningFullErrorMessage(error);
    userLogger.error(message);
    throw new UnsuccessfulActionError(`Failed to Query entities: ${message}`);
  }

  const entityType = findEntityType(rawPayload);
  userLogger.info(`[get-entities] Retrieved ${entities.length} entities of type: ${entityType}`);

  response = {
    billing_metrics: payload.billingMetrics.split(","),
    entity_ids: entities,
    entity_type: entityType,
  };

  return response;
};
