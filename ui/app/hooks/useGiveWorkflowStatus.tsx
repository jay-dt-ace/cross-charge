import { workflowsClient } from "@dynatrace-sdk/client-automation";
import { useEffect, useState } from "react";
import { showErrorToast } from "../Components/Reusable/Toasts/toasts";
import { giveMeaningFullErrorMessage } from "../utils/helpers";

/**
 * Checks whether WF is already created by App
 */

const useGiveWorkflowStatus = () => {
  const [wfError, setWfError] = useState(false);
  const [existingWorkflow, setExistingWorkflow] = useState({
    id: "",
    title: "",
  });

  useEffect(() => {
    const getWorkflowInfoData = async () => {
      try {
        const data = await workflowsClient.getWorkflows();
        const results = Array.isArray(data.results) ? data.results : [];

        const getWorkflow = results.find((wf) =>
          wf.title.includes("Cross Charge"),
        );

        if (getWorkflow?.id) {
          setExistingWorkflow({
            id: getWorkflow.id,
            title: getWorkflow.title,
          });
        }
      } catch (error) {
        showErrorToast({
          title: "Unable to load workflow",
          message: giveMeaningFullErrorMessage(error),
        });
        setWfError(true);
      }
    };
    void getWorkflowInfoData();
  }, []);

  return { wfError, existingWorkflow };
};

export default useGiveWorkflowStatus;
