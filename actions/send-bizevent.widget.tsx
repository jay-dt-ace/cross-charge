import {
  AutomationTextInput,
  AutomationConnectionPicker,
} from "@dynatrace/automation-action-components";
import {
  FormField,
  Label,
  Switch,
} from "@dynatrace/strato-components-preview/forms";
import { type ActionWidget } from "@dynatrace-sdk/automation-action-utils";
import React from "react";
import { FormattedMessage } from "react-intl";

interface SendBizeventInput {
  bizeventRef: string;
  localIngest: boolean;
  connectionId: string;
}

const SendBizeventWidget: ActionWidget<SendBizeventInput> = (props) => {
  const { value, onValueChanged } = props;

  const updateValue = (newValue: Partial<SendBizeventInput>) => {
    onValueChanged({ ...value, ...newValue });
  };

  return (
    <>
      <FormField>
        <Switch
          defaultValue={value.localIngest}
          onChange={(localIngest) => updateValue({ localIngest })}
        >
          <FormattedMessage
            defaultMessage="Local Ingestion of bizevents"
            id="WQna4Jrqtwj06TaR"
          ></FormattedMessage>
        </Switch>
      </FormField>
      <FormField style={{ display: !value.localIngest ? "block" : "none" }}>
        <Label>
          <FormattedMessage
            defaultMessage="Connection"
            id="ZRLuFUHppsUtW/fP"
          ></FormattedMessage>
        </Label>
        <AutomationConnectionPicker
          connectionId={value.connectionId}
          schema="send-bizevent-connection"
          onChange={(connectionId) => updateValue({ connectionId })}
        />
      </FormField>
      <FormField>
        <Label>
          <FormattedMessage
            defaultMessage="Reference to Billing Usage Action"
            id="Vx/Ryr8W2C6EHZUy"
          ></FormattedMessage>
        </Label>
        <AutomationTextInput
          value={value.bizeventRef}
          onChange={(bizeventRef) => updateValue({ bizeventRef })}
        />
      </FormField>
    </>
  );
};

export default SendBizeventWidget;
