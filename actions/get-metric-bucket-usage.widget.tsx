import { type ActionWidget } from "@dynatrace-sdk/automation-action-utils";
import React from "react";

interface GetMetricBucketUsageInput {
  name: string;
}

const GetMetricBucketUsageWidget: ActionWidget<GetMetricBucketUsageInput> = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _props,
) => {
  return <div></div>;
};

export default GetMetricBucketUsageWidget;
