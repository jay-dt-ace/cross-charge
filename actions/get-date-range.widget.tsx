import { FormField, Label, TextInput } from "@dynatrace/strato-components-preview/forms";
import { type ActionWidget } from "@dynatrace-sdk/automation-action-utils";
import React from "react";
import { FormattedMessage } from "react-intl";

interface GetDateRangeInput {
  target_date: string;
}

const GetDateRangeWidget: ActionWidget<GetDateRangeInput> = (props) => {
  const { value, onValueChanged } = props;

  const updateValue = (newValue: Partial<GetDateRangeInput>) => {
    onValueChanged({ ...value, ...newValue });
  };

  return (
    <FormField>
      <Label>
        <FormattedMessage
          defaultMessage="Target Date (YYYY-MM-DD) — leave blank to use yesterday"
          id="getDateRange.targetDate"
        />
      </Label>
      <TextInput
        value={value.target_date ?? ""}
        onChange={(val) => updateValue({ target_date: val ?? "" })}
        placeholder="e.g. 2026-09-25"
      />
    </FormField>
  );
};

export default GetDateRangeWidget;
