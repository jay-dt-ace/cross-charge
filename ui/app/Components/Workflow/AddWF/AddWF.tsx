import { Button } from "@dynatrace/strato-components/buttons";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Paragraph, List, Text } from "@dynatrace/strato-components/typography";
import { MessageContainer } from "@dynatrace/strato-components-preview/content";
import { OpenWithIcon } from "@dynatrace/strato-icons";
import { getEnvironmentUrl } from "@dynatrace-sdk/app-environment";
import { sendIntent } from "@dynatrace-sdk/navigation";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { FormattedMessage } from "react-intl";
import { workflow } from "../../../../documents/crosscharge";
import useCheckPermissions from "../../../hooks/useCheckPermissions";
import useGiveWorkflowStatus from "../../../hooks/useGiveWorkflowStatus";
import { giveMeaningFullErrorMessage } from "../../../utils/helpers";
import { ErrorBoundaryFallbackUI } from "../../Reusable/ErrorBoundaryFallbackUI/ErrorBoundaryFallbackUI";
import { ExternalLinkComponentForDirectLink } from "../../Reusable/ExternalLinkComponents/ExternalLinkComponents";
import { showErrorToast, showSuccessToast } from "../../Reusable/Toasts/toasts";
import {
  linkToWfMessage,
  missingPermissionsContactMessage,
  missingPermissionsDescriptionMessage,
  missingPermissionsTitleMessage,
} from "../messages";

const AddWFV2: React.FC = () => {
  /** Component Internal States */
  const tenantUrl = getEnvironmentUrl();

  /** Custom Hooks */
  const { existingWorkflow, wfError } = useGiveWorkflowStatus();
  const {
    missingPermissions,
    isCheckingPermissions,
    authError,
    recheckPermissions,
  } = useCheckPermissions();

  /** Handles WF Creation */
  const handleCreateWf = async () => {
    // Check permissions before creating workflow
    await recheckPermissions();

    if (missingPermissions.length > 0) {
      showErrorToast({
        title: "Missing Required Permissions",
        message: `You are missing ${missingPermissions.length} required permission(s). Please contact your administrator.`,
      });
      return;
    }

    try {
      // create wf
      sendIntent(workflow, {
        recommendedAppId: "dynatrace.automations",
        recommendedIntentId: "create-workflow",
      });

      // show success toasts
      showSuccessToast({ title: `Successfully Created Workflow ` });
    } catch (error: unknown) {
      const message = giveMeaningFullErrorMessage(error);

      showErrorToast({ title: `Error in Creating Workflow`, message });
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorBoundaryFallbackUI}>
      {/* Missing Permissions Message */}
      {missingPermissions.length > 0 && !existingWorkflow.id ? (
        <MessageContainer variant="critical">
          <MessageContainer.Title>
            <FormattedMessage {...missingPermissionsTitleMessage} />
          </MessageContainer.Title>
          <MessageContainer.Description>
            <Flex flexDirection="column" gap={24}>
              <Paragraph>
                <FormattedMessage {...missingPermissionsDescriptionMessage} />
              </Paragraph>
              <List>
                {missingPermissions.map((permission) => (
                  <Text key={permission}>{permission}</Text>
                ))}
              </List>
              <Paragraph>
                <FormattedMessage {...missingPermissionsContactMessage} />
              </Paragraph>
            </Flex>
          </MessageContainer.Description>
        </MessageContainer>
      ) : null}

      <Flex
        flexDirection="row"
        width="300px"
        justifyContent="space-around"
        alignItems="center"
      >
        <>
          {!existingWorkflow.id ? (
            <Button
              variant="emphasized"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handleCreateWf}
              disabled={isCheckingPermissions || missingPermissions.length > 0}
            >
              <Button.Suffix>
                <OpenWithIcon />
              </Button.Suffix>
              <FormattedMessage
                defaultMessage="Install Workflow"
                id="lsuSC1tT/RXaem4g"
              />
            </Button>
          ) : (
            !wfError &&
            !authError && (
              <ExternalLinkComponentForDirectLink
                href={`${tenantUrl}/ui/apps/dynatrace.automations/workflows/${existingWorkflow.id}`}
                message={linkToWfMessage}
              />
            )
          )}
        </>
      </Flex>
    </ErrorBoundary>
  );
};

export default AddWFV2;
