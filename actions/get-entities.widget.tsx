import {
  AutomationTextInput,
  AutomationSelect,
} from "@dynatrace/automation-action-components";
import {
  FormField,
  Label,
  FormFieldMessages,
  Select,
} from "@dynatrace/strato-components-preview/forms";
import { type ActionWidget } from "@dynatrace-sdk/automation-action-utils";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";

interface GetEntitiesInput {
  entityType: string;
  otherType: string;
  billingMetrics: string;
}

interface OptionsType {
  id: number;
  value: string;
  label: string;
}

const options: OptionsType[] = [
  {
    id: 1,
    value: "mainframe",
    label: "Mainframe",
  },
  {
    id: 2,
    value: "serverless",
    label: "Serverless",
  },
  {
    id: 3,
    value: "generic_entity",
    label: "Generic Entity",
  },
  {
    id: 4,
    value: "full_stack",
    label: "Full Stack",
  },
  {
    id: 5,
    value: "infra",
    label: "Infra Only Hosts",
  },
  {
    id: 6,
    value: "foundation",
    label: "F&D Hosts",
  },
  {
    id: 7,
    value: "other",
    label: "Other (Built-In) Entity Type",
  },
];

const GetEntitiesWidget: ActionWidget<GetEntitiesInput> = (props) => {
  const { value, onValueChanged } = props;
  const intl = useIntl();

  const updateValue = (newValue: Partial<GetEntitiesInput>) => {
    onValueChanged({ ...value, ...newValue });
  };

  return (
    <>
      <FormField required>
        <Label>
          <FormattedMessage
            defaultMessage="Entity Type"
            id="u06ZaEQftz/ngkXe"
          ></FormattedMessage>
        </Label>
        <AutomationSelect
          value={value.entityType ?? ""}
          onChange={(newValue) => {
            const newType = newValue ?? "";
            updateValue({ entityType: newType });
          }}
        >
          <Select.Content>
            {options.map((eachOption) => (
              <Select.Option key={eachOption.id} value={eachOption.value}>
                {eachOption.label}
              </Select.Option>
            ))}
          </Select.Content>
        </AutomationSelect>
        <br />
      </FormField>
      <FormField
        style={{
          display:
            value.entityType === "other" ||
            value.entityType === "generic_entity"
              ? "block"
              : "none",
        }}
      >
        <Label>
          <FormattedMessage
            defaultMessage="Other Entity Type *"
            id="C8Goj5kWy4irQVjW"
          ></FormattedMessage>
        </Label>
        <AutomationTextInput
          placeholder={intl.formatMessage({
            defaultMessage: "Enter entity type",
            id: "Qgsmo2tV1JmcyjYJ",
          })}
          value={value.otherType}
          onChange={(otherType) => updateValue({ otherType })}
        />
        <FormFieldMessages />
      </FormField>
      <br />
      <FormField required>
        <Label>
          <FormattedMessage
            defaultMessage="Billing Metrics (CSV)"
            id="UA8yrlXvWVuRcQX5"
          ></FormattedMessage>
        </Label>
        <AutomationTextInput
          // example: builtin:billing.full_stack_monitoring.usage_per_host,builtin:billing.runtime_vulnerability_analytics.usage_per_host
          placeholder={intl.formatMessage({
            defaultMessage: "Enter your Billing Metrics",
            id: "2qVKg/pkn4tkcIEr",
          })}
          value={value.billingMetrics}
          onChange={(billingMetrics) => updateValue({ billingMetrics })}
        />
        <FormFieldMessages />
      </FormField>
    </>
  );
};

export default GetEntitiesWidget;
