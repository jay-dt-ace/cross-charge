import { AutomationConnectionPicker } from "@dynatrace/automation-action-components";
import { FormField, Label } from "@dynatrace/strato-components-preview/forms";
import { type ActionWidget } from "@dynatrace-sdk/automation-action-utils";
import React from "react";
import { FormattedMessage } from "react-intl";

interface GetRateCardInput {
  connectionId: string;
}

const GetRateCardWidget: ActionWidget<GetRateCardInput> = (props) => {
  const { value, onValueChanged } = props;

  const updateValue = (newValue: Partial<GetRateCardInput>) => {
    onValueChanged({ ...value, ...newValue });
  };

  return (
    <FormField>
      <Label>
        <FormattedMessage
          defaultMessage="Configuration"
          id="dUFkhQ84weza9rjt"
        ></FormattedMessage>
      </Label>
      <AutomationConnectionPicker
        connectionId={value.connectionId}
        schema="get-rate-card-connection"
        onChange={(connectionId) => updateValue({ connectionId })}
      />
    </FormField>
  );
};

export default GetRateCardWidget;
