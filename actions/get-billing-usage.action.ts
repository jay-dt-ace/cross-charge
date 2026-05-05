import { getEnvironmentId } from "@dynatrace-sdk/app-environment";
import {
  UnsuccessfulActionError,
  userLogger,
} from "@dynatrace-sdk/automation-action-utils/actions";
import { metricsClient } from "@dynatrace-sdk/client-classic-environment-v2";
import { giveMeaningFullErrorMessage } from "../ui/app/utils/helpers";
import { getBillingUsageSchema } from "../ui/shared/types/get-billing-usage";
import yesterday from "../ui/shared/utils";

interface Capability {
  key: string;
  name: string;
  quotedPrice: string | null;
  quotedUnitOfMeasure: string;
  price: string;
}

interface NewRateCard {
  quoteNumber: string;
  currencyCode: string;
  startTime: string;
  endTime: string;
  capabilities: Record<string, Capability>;
}

function metricToRateCard(billingMetric: string, rateCard: NewRateCard) {
  try {
    switch (billingMetric) {
      case "builtin:billing.full_stack_monitoring.usage_per_host":
        return rateCard.capabilities.FULLSTACK_MONITORING;
      case "builtin:billing.infrastructure_monitoring.usage_per_host":
        return rateCard.capabilities.INFRASTRUCTURE_MONITORING;
      case "builtin:billing.foundation_and_discovery.usage_per_host":
        return rateCard.capabilities.FOUNDATION_AND_DISCOVERY;
      case "builtin:billing.runtime_vulnerability_analytics.usage_per_host":
        return rateCard.capabilities.RUNTIME_VULNERABILITY_ANALYTICS;
      case "builtin:billing.real_user_monitoring.web.session.usage_by_app":
      case "builtin:billing.real_user_monitoring.mobile.session.usage_by_app":
        return rateCard.capabilities.USER_SESSIONS;
      case "builtin:billing.real_user_monitoring.web.session_with_replay.usage_by_app":
      case "builtin:billing.real_user_monitoring.mobile.session_with_replay.usage_by_app":
        return rateCard.capabilities.USER_SESSION_REPLAYS;
      case "builtin:billing.real_user_monitoring.web.property.usage_by_application":
      case "builtin:billing.real_user_monitoring.mobile.property.usage_by_application":
        return rateCard.capabilities.USER_SESSION_PROPERTIES;
      case "builtin:billing.kubernetes_monitoring.usage":
        return rateCard.capabilities.KUBERNETES_OPERATIONS;
      case "builtin:billing.serverless_functions_classic.usage_by_entity":
        return rateCard.capabilities.SERVERLESS;
      case "builtin:billing.synthetic.requests.usage_by_http_monitor":
        return rateCard.capabilities.SYNTHETIC_MONITORING_HTTP;
      case "builtin:billing.synthetic.external.usage_by_third_party_monitor":
        return rateCard.capabilities.SYNTHETIC_MONITORING_THIRD_PARTY;
      case "builtin:billing.synthetic.actions.usage_by_browser_monitor":
        return rateCard.capabilities.SYNTHETIC_MONITORING_BROWSER;
      case "builtin:billing.custom_metrics_classic.usage.fullstack_hosts":
      case "builtin:billing.custom_metrics_classic.usage.infrastructure_hosts":
      case "builtin:billing.custom_metrics_classic.usage.foundation_and_discovery":
        return rateCard.capabilities.METRICS;
      case "builtin:billing.mainframe_monitoring.usage":
        return rateCard.capabilities.MAINFRAME_MONITORING;
      default:
        return rateCard.capabilities.FULLSTACK_MONITORING;
    }
  } catch (e) {
    userLogger.error(
      "Could not find correct rate card capability : " + (e as string),
    );
    return rateCard.capabilities.FULLSTACK_MONITORING;
  }
}

function buildBillingMetricKey(
  billingMetric: string,
  entityType: string,
  entityId: string,
) {
  const includedMetricKeys: string[] = [
    "builtin:billing.custom_metrics_classic.usage.foundation_and_discovery",
    "builtin:billing.custom_metrics_classic.usage.infrastructure_hosts",
    "builtin:billing.custom_metrics_classic.usage.fullstack_hosts",
  ];

  if (!includedMetricKeys.includes(billingMetric)) {
    let metricFilter =
      ':filter(and(or(in("dt.entity.' +
      entityType +
      '",entitySelector("entityId(~"' +
      entityId +
      '~")")))))';

    if (entityType === "custom_application") {
      metricFilter =
        ':filter(and(or(in("dt.entity.device_application",entitySelector("type(' +
        entityType +
        '),entityId(~"' +
        entityId +
        '~")")))))';
    } else if (entityType === "service") {
      metricFilter =
        ':filter(and(or(in("dt.entity.monitored_entity",entitySelector("type(' +
        entityType +
        '),entityId(~"' +
        entityId +
        '~")")))))';
    }
    billingMetric += metricFilter;
  }
  return billingMetric;
}

function buildBizEvent(
  billedData: number,
  rateCard: Capability,
  toTime: string,
  rawPayload: unknown,
) {
  const payload = getBillingUsageSchema.parse(rawPayload);

  const bizevent = {
    specversion: "1.0",
    source: "dynatrace.cross.charge",
    id: crypto.randomUUID(),
    type: "dynatrace.cross.charge",
    data: {},
  };

  const bizeventData: Record<string, string | number> = {};

  bizeventData.tenant = getEnvironmentId();
  bizeventData.billedEntityId = payload.entityInfo.entity_id;
  bizeventData.billedEntityName = payload.entityInfo.entity_name;
  bizeventData.rate = rateCard.price;
  bizeventData.module = rateCard.key;
  bizeventData.unitofmeasure = rateCard.quotedUnitOfMeasure;

  if (payload.metricBucket) {
    // multiply total by shared equal percentage of included host type metric bucket
    billedData = billedData * payload.metricBucket;
  }
  bizeventData.cost = billedData * parseFloat(rateCard.price);
  bizeventData.billedMetric = billedData;
  bizeventData.UTCBilleddate = toTime + "Z";
  bizeventData.currency = payload.rateCard.rate_card.currencyCode;
  //bizevent_data["execution_id"] = "TODO";
  for (const [key, value] of Object.entries(payload.entityInfo.tags)) {
    bizeventData[key] = value;
  }
  bizevent.data = bizeventData;

  return bizevent;
}

export default async (rawPayload: unknown) => {
  const payload = getBillingUsageSchema.parse(rawPayload);

  const bizevents: Record<
    string,
    string | number | Record<string, string | number>
  >[] = [];
  // if (!payload.billing_metrics) {
  //   throw new Error("Input field 'billing metric' placeholder is missing.");
  // }

  // if (!payload.entity_info) {
  //   throw new Error("Input field 'entity_info' placeholder is missing.");
  // }

  try {
    const entityType = payload.entityType;

    const interval = yesterday();
    if (Object.keys(payload.entityInfo.tags).length > 0) {
      for (const billingMetric of payload.billingMetrics) {
        const rateCard = metricToRateCard(
          billingMetric,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          payload.rateCard.rate_card as NewRateCard,
        );
        const billingMetricQuery = buildBillingMetricKey(
          billingMetric,
          entityType,
          payload.entityInfo.entity_id,
        );

        const data = await metricsClient.query({
          acceptType: "application/json; charset=utf-8",
          metricSelector: billingMetricQuery,
          resolution: "inf",
          from: interval.from_time,
          to: interval.to_time,
        });
        //userLogger.info(JSON.stringify(data));
        const billedData = data.result[0].data[0]?.values[0];
        //userLogger.info(JSON.stringify(billedData));
        if (billedData > 0) {
          const bizevent = buildBizEvent(
            billedData,
            rateCard,
            interval.to_time,
            rawPayload,
          );
          bizevents.push(bizevent);
        }
      }
    }
  } catch (error: unknown) {
    const message = giveMeaningFullErrorMessage(error);
    userLogger.error(message);
    throw new UnsuccessfulActionError(
      `Failed to Fetch billing usage: ${message}`,
    );
  }

  return bizevents;
};
