import { EmptyState } from "@dynatrace/strato-components-preview/content";
import React from "react";
import { FormattedMessage } from "react-intl";
import AddWF from "../Workflow/AddWF/AddWF";
import AppSettingsComponent from "./AppSettingsComponent";
import AppVisualizationComponent from "./AppVisualizationComponent";
import HeadingComponent from "./HeadingComponent";
import { appDescriptionMessage } from "./messages";

const Main: React.FC = () => {
  return (
    <EmptyState>
      {/* App Heading */}
      <EmptyState.Title>
        <HeadingComponent />
      </EmptyState.Title>

      {/* In Details, we have only app description */}
      <EmptyState.Details>
        <FormattedMessage {...appDescriptionMessage} />
      </EmptyState.Details>

      {/* Adding Workflow is taken inside actions */}
      <EmptyState.Actions>
        <AddWF />
      </EmptyState.Actions>

      {/* Footer includes settings buttons/links */}
      <EmptyState.Footer>
        <AppVisualizationComponent />
        <br></br>
        <br></br>
        <AppSettingsComponent />
      </EmptyState.Footer>
    </EmptyState>
  );
};

export default Main;
