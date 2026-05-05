import { effectivePermissionsClient } from "@dynatrace-sdk/client-platform-management-service";
import { useCallback, useEffect, useState } from "react";
import { APP_SCOPES } from "../../../app-config/scopes";
import { giveMeaningFullErrorMessage } from "../utils/helpers";

/**
 * This custom hook is used to check if the user has all required permissions
 * @returns Object containing permission check state and methods
 */
const useCheckPermissions = () => {
  const [missingPermissions, setMissingPermissions] = useState<string[]>([]);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [authError, setAuthError] = useState(false);

  /**
   * Checks all required permissions from APP_SCOPES
   * @returns Array of missing permission names
   */
  const checkPermissions = useCallback(async (): Promise<string[]> => {
    try {
      const permissionsToCheck = APP_SCOPES.map(
        (scope: { name: string; comment: string }) => ({
          permission: scope.name,
        }),
      );

      const result =
        await effectivePermissionsClient.resolveEffectivePermissions({
          body: {
            permissions: permissionsToCheck,
          },
        });

      const missing: string[] = [];
      result.forEach((permissionResult, index) => {
        if (permissionResult.granted === "false") {
          missing.push(APP_SCOPES[index].name);
        }
      });

      return missing;
    } catch (error: unknown) {
      const message = giveMeaningFullErrorMessage(error);
      if (message.includes("Forbidden")) {
        setAuthError(true);
      }
      return [];
    }
  }, []);

  /**
   * Rechecks permissions and updates state
   */
  const recheckPermissions = useCallback(async () => {
    setIsCheckingPermissions(true);
    const missing = await checkPermissions();
    setMissingPermissions(missing);
    setIsCheckingPermissions(false);
  }, [checkPermissions]);

  // Check permissions on mount
  useEffect(() => {
    void recheckPermissions();
  }, [recheckPermissions]);

  return {
    missingPermissions,
    isCheckingPermissions,
    authError,
    recheckPermissions,
    hasAllPermissions: missingPermissions.length === 0,
  };
};

export default useCheckPermissions;
