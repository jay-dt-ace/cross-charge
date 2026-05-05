import { AutomationTextInput } from "@dynatrace/automation-action-components";
import { FormField, Label } from "@dynatrace/strato-components-preview/forms";
import { type ActionWidget } from "@dynatrace-sdk/automation-action-utils";
import React from "react";
import { FormattedMessage } from "react-intl";

interface GetBillingUsageInput {
  billingMetrics: string;
  entityInfo: string;
  entityType: string;
  rateCard: string;
  metricBucket: string;
}

const GetBillingUsageWidget: ActionWidget<GetBillingUsageInput> = (props) => {
  const { value, onValueChanged } = props;

  const updateValue = (newValue: Partial<GetBillingUsageInput>) => {
    onValueChanged({ ...value, ...newValue });
  };

  return (
    <>
      <FormField>
        <Label>
          <FormattedMessage
            defaultMessage="Billing Metric Reference"
            id="VYB9IVmsHhlLANP8"
          ></FormattedMessage>
        </Label>
        <AutomationTextInput
          value={value.billingMetrics}
          onChange={(billingMetrics) => updateValue({ billingMetrics })}
        />
      </FormField>
      <FormField>
        <Label>
          <FormattedMessage
            defaultMessage="Entity Reference"
            id="JkOyL0Pi+lVFqq98"
          ></FormattedMessage>
        </Label>
        <AutomationTextInput
          value={value.entityInfo}
          onChange={(entityInfo) => updateValue({ entityInfo })}
        />
      </FormField>
      <FormField>
        <Label>
          <FormattedMessage
            defaultMessage="Entity Type Reference"
            id="tZhO16tkT1mgRB9F"
          ></FormattedMessage>
        </Label>
        <AutomationTextInput
          value={value.entityType}
          onChange={(entityType) => updateValue({ entityType })}
        />
      </FormField>
      <FormField>
        <Label>
          <FormattedMessage
            defaultMessage="Rate Card Info Reference"
            id="SUNjgu8ntUdEL6Pp"
          ></FormattedMessage>
        </Label>
        <AutomationTextInput
          value={value.rateCard}
          onChange={(rateCard) => updateValue({ rateCard })}
        />
      </FormField>
      <FormField>
        <Label>
          <FormattedMessage
            defaultMessage="Metric Buckets"
            id="VOBfppBtmZMTtQ9Z"
          ></FormattedMessage>
        </Label>
        <AutomationTextInput
          value={value.metricBucket}
          onChange={(metricBucket) => updateValue({ metricBucket })}
        />
      </FormField>
    </>
  );
};

export default GetBillingUsageWidget;
