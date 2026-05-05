import { type ActionWidget } from "@dynatrace-sdk/automation-action-utils";
import React from "react";

interface GetGenericEntityTypesInput {
  name: string;
}

const GetGenericEntityTypesWidget: ActionWidget<GetGenericEntityTypesInput> = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _props,
) => {
  return <div></div>;
};

export default GetGenericEntityTypesWidget;
