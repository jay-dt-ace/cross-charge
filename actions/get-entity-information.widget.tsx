import { AutomationTextInput } from "@dynatrace/automation-action-components";
import { FormField, Label } from "@dynatrace/strato-components-preview/forms";
import { type ActionWidget } from "@dynatrace-sdk/automation-action-utils";
import React from "react";
import { FormattedMessage } from "react-intl";

interface GetEntityInformationInput {
  entity: string;
  tagKeys: string;
}

const GetEntityInformationWidget: ActionWidget<GetEntityInformationInput> = (
  props,
) => {
  const { value, onValueChanged } = props;

  const updateValue = (newValue: Partial<GetEntityInformationInput>) => {
    onValueChanged({ ...value, ...newValue });
  };

  return (
    <>
      <FormField>
        <Label>
          <FormattedMessage
            defaultMessage="Entity Info"
            id="FWBghcLEJ/djinEa"
          ></FormattedMessage>
        </Label>
        <AutomationTextInput
          value={value.entity}
          onChange={(entity) => updateValue({ entity })}
        />
      </FormField>
      <FormField>
        <Label>
          <FormattedMessage
            defaultMessage="Tags"
            id="hI7tD71UKfVWspgt"
          ></FormattedMessage>
        </Label>
        <AutomationTextInput
          value={value.tagKeys}
          onChange={(tagKeys) => updateValue({ tagKeys })}
        />
      </FormField>
    </>
  );
};

export default GetEntityInformationWidget;
