import {
  UnsuccessfulActionError,
  userLogger,
} from "@dynatrace-sdk/automation-action-utils/actions";
import { metricsClient } from "@dynatrace-sdk/client-classic-environment-v2";
import { isUndefined, isNull, isNaN } from "lodash-es";
import { giveMeaningFullErrorMessage } from "../ui/app/utils/helpers";
import yesterday from "../ui/shared/utils";

// we won't get any payload bcoz, this widget doesn't have UI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async (_rawPayload: unknown) => {
  const fullstackBilled =
    "builtin:billing.custom_metrics_classic.usage.fullstack_hosts:splitBy()";
  const fullstackUsage =
    "builtin:billing.full_stack_monitoring.metric_data_points.ingested:splitBy()";

  const infraBilled =
    "builtin:billing.custom_metrics_classic.usage.infrastructure_hosts:splitBy()";
  const infraUsage =
    "builtin:billing.infrastructure_monitoring.metric_data_points.ingested:splitBy()";

  const foundationBilled =
    "builtin:billing.custom_metrics_classic.usage.foundation_and_discovery:splitBy()";
  const foundationUsage =
    "builtin:billing.foundation_and_discovery.metric_data_points.ingested:splitBy()";

  const interval = yesterday();

  /**
   * FS -> FullStack, FD -> Foundation, I -> Infra
   * U -> Usage, B -> Billed
   */
  const metricsToPoll = {
    FS_U: { metric: fullstackUsage, result: 0 },
    FS_B: { metric: fullstackBilled, result: 0 },
    I_U: { metric: infraUsage, result: 0 },
    I_B: { metric: infraBilled, result: 0 },
    FD_U: { metric: foundationUsage, result: 0 },
    FD_B: { metric: foundationBilled, result: 0 },
  };

  for (const value of Object.values(metricsToPoll)) {
    try {
      const data = await metricsClient.query({
        acceptType: "application/json; charset=utf-8",
        metricSelector: value.metric,
        resolution: "inf",
        from: interval.from_time,
        to: interval.to_time,
      });
      if (data.result[0]) {
        value.result = data.result[0].data[0]?.values[0];
      }
    } catch (error: unknown) {
      const errorMessage = giveMeaningFullErrorMessage(error);
      userLogger.error(errorMessage);
      throw new UnsuccessfulActionError(
        `Failed to query metrics ${errorMessage}`,
      );
    }
  }

  // If result is 0, return 0 else, divide billed/usage
  let FSPercent =
    metricsToPoll.FS_U.result === 0
      ? 0
      : metricsToPoll.FS_B.result / metricsToPoll.FS_U.result;
  let IPercent =
    metricsToPoll.I_U.result === 0
      ? 0
      : metricsToPoll.I_B.result / metricsToPoll.I_U.result;
  let FDPercent =
    metricsToPoll.FD_U.result === 0
      ? 0
      : metricsToPoll.FD_B.result / metricsToPoll.FD_U.result;

  if (isNaN(FSPercent) || isUndefined(FSPercent) || isNull(FSPercent)) {
    FSPercent = 0;
  }
  if (isNaN(IPercent) || isUndefined(IPercent) || isNull(IPercent)) {
    IPercent = 0;
  }
  if (isNaN(FDPercent) || isUndefined(FDPercent) || isNull(FDPercent)) {
    FDPercent = 0;
  }

  return { FS_percent: FSPercent, I_percent: IPercent, FD_percent: FDPercent };
};
