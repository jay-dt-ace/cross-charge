import {
  UnsuccessfulActionError,
  userLogger,
} from "@dynatrace-sdk/automation-action-utils/actions";
import { getEnvironmentUrl } from "@dynatrace-sdk/app-environment";
import { appSettingsObjectsClient } from "@dynatrace-sdk/client-app-settings-v2";
import { defaultRateCard } from "../ui/documents/default-rate-card";
import { getRateCardSchema } from "../ui/shared/types/get-ratecard";

/**
 * Ratecard types
 */
export interface RateCardCapabilitiesType {
  key: string;
  name: string;
  quotedPrice: string;
  quotedUnitOfMeasure: string;
  price: string;
}

export interface RateCardResponse {
  quoteNumber: string;
  startTime: string;
  endTime: string;
  currencyCode: string;
  capabilities: RateCardCapabilitiesType[];
}

export interface ModifiedRateCardResponse {
  quoteNumber: string;
  startTime: string;
  endTime: string;
  currencyCode: string;
  capabilities: Record<string, RateCardCapabilitiesType>;
}

export interface RateCardSettingsType {
  rate_card_type: "account" | "default";
  client_id?: string;
  client_secret?: string;
  account_id?: string;
  tag_keys?: TagAlias[];
}

export interface TagAlias {
  tag_key: string;
  tag_alias?: string;
}

function getSsoUrl(): string {
  const envUrl = getEnvironmentUrl();
  if (envUrl.includes("sprint") && envUrl.includes("dynatracelabs.com")) {
    return "https://sso-sprint.dynatracelabs.com/sso/oauth2/token";
  }
  if (envUrl.includes("dynatracelabs.com")) {
    return "https://sso-dev.dynatracelabs.com/sso/oauth2/token";
  }
  return "https://sso.dynatrace.com/sso/oauth2/token";
}

function giveApiBaseUrl(): string {
  const envUrl = getEnvironmentUrl();
  if (envUrl.includes("sprint") && envUrl.includes("dynatracelabs.com")) {
    return "https://api-hardening.internal.dynatracelabs.com";
  }
  if (envUrl.includes("dynatracelabs.com")) {
    return "https://api-dev.dynatracelabs.com";
  }
  return "https://api.dynatrace.com";
}

function giveRateCardUrl(accoundId: string) {
  return `${giveApiBaseUrl()}/sub/v1/accounts/${accoundId}/rate-cards`;
}

/**
 * Authenticate to SSO
 *
 * @param oauthUrl
 * @param clientId
 * @param clientSecret
 */
export async function authenticate(
  oauthUrl: string,
  clientId: string,
  clientSecret: string,
  resource: string,
) {
  const grantType = "client_credentials";
  const scope = "account-uac-read";

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  const urlencoded = new URLSearchParams();
  urlencoded.append("grant_type", grantType);
  urlencoded.append("client_id", clientId);
  urlencoded.append("client_secret", clientSecret);
  urlencoded.append("scope", scope);
  urlencoded.append("resource", resource);

  const response = await fetch(oauthUrl, {
    method: "POST",
    redirect: "follow",
    cache: "no-cache",
    headers: myHeaders,
    body: urlencoded,
  });

  if (!response.ok) {
    throw new UnsuccessfulActionError(
      `Failed to authenticate: ${response.statusText}`,
    );
  }

  const responseJson: unknown = await response.json();

  if (
    responseJson &&
    typeof responseJson === "object" &&
    "access_token" in responseJson
  ) {
    return responseJson.access_token;
  }

  throw new UnsuccessfulActionError(
    "Authenticate response does not contain an acces_token",
  );
}

/**
 * Gives Rate Card values
 *
 * @param rateCardUrl
 * @param accessToken
 */
export async function getRateCardValuesWithToken(
  rateCardUrl: string,
  accessToken: string,
) {
  const rateCardHeaders = new Headers();
  rateCardHeaders.append("Authorization", "Bearer " + accessToken);

  const response = await fetch(rateCardUrl, {
    method: "GET",
    headers: rateCardHeaders,
    cache: "no-cache",
    redirect: "follow" as RequestRedirect,
  });

  if (!response.ok) {
    throw new UnsuccessfulActionError(
      `Failed to fetch rate card values: ${response.statusText}`,
    );
  }

  const responseJson: RateCardResponse[] =
    (await response.json()) as RateCardResponse[];
  return responseJson;
}

/**
 * @returns Valid RateCard with checking current date
 */

export function findValidRateCard(
  rateCardResponse: RateCardResponse[],
): RateCardResponse {
  const today = new Date().getTime();

  const validCards = rateCardResponse.filter((rc) => {
    const start = Date.parse(rc.startTime);
    const end = Date.parse(rc.endTime);
    return start <= today && today <= end;
  });

  if (validCards.length > 0) {
    // Pick the active card with the most capabilities (the main contract, not an addendum)
    return validCards.reduce((best, rc) =>
      rc.capabilities.length > best.capabilities.length ? rc : best,
    );
  }

  // defaults to the first rate card in the response if none match today's date
  return rateCardResponse[0] ?? {
    quoteNumber: "",
    currencyCode: "",
    startTime: "",
    endTime: "",
    capabilities: [],
  };
}

export function reconfigureRateCardCapabilities(
  validRateCard: RateCardResponse,
) {
  const newValidRateCard: ModifiedRateCardResponse = {
    quoteNumber: "",
    currencyCode: "",
    startTime: "",
    endTime: "",
    capabilities: {},
  };

  newValidRateCard.capabilities = {};
  newValidRateCard.quoteNumber = validRateCard.quoteNumber;
  newValidRateCard.currencyCode = validRateCard.currencyCode;
  newValidRateCard.startTime = validRateCard.startTime;
  newValidRateCard.endTime = validRateCard.endTime;

  const newCapabilities: Record<string, RateCardCapabilitiesType> = {};
  for (const capability of validRateCard.capabilities) {
    newCapabilities[capability.key] = capability;
  }

  newValidRateCard.capabilities = newCapabilities;
  return newValidRateCard;
}

function checkTagKeys(settings: RateCardSettingsType) {
  if (!settings.tag_keys) {
    throw new UnsuccessfulActionError("Input field 'Tag Keys' is missing.");
  }
  if (settings.tag_keys.length === 0) {
    throw new UnsuccessfulActionError("Array size of 'Tag Keys' is 0.");
  }
}

export default async (rawPayload: unknown) => {
  // userLogger.info(JSON.stringify(rawPayload));
  const payload = getRateCardSchema.parse(rawPayload);
  let rateCardResponse = [] as RateCardResponse[];

  if (!payload.connectionId) {
    throw new UnsuccessfulActionError(
      "Input field 'Configuration' is missing.",
    );
  }

  const settingsResponse =
    await appSettingsObjectsClient.getAppSettingsObjectByObjectId({
      objectId: payload.connectionId,
    });

  if (!settingsResponse.value) {
    throw new UnsuccessfulActionError("Could not find Configuration");
  }

  const settings = settingsResponse.value as RateCardSettingsType;
  // console.log(settings);

  checkTagKeys(settings);

  if (settings.rate_card_type === "default") {
    rateCardResponse = defaultRateCard;
  } else {
    if (!settings.client_id) {
      throw new UnsuccessfulActionError("Input field 'client id' is missing.");
    }
    if (!settings.client_secret) {
      throw new UnsuccessfulActionError(
        "Input field 'client secret' is missing.",
      );
    }
    if (!settings.account_id) {
      throw new UnsuccessfulActionError("Input field 'account id' is missing.");
    }
    try {
      // append the account_id with urn:dtaccount: , as authentication requires this
      const resource = `urn:dtaccount:${settings.account_id}`;
      const accessToken = await authenticate(
        getSsoUrl(),
        settings.client_id,
        settings.client_secret,
        resource,
      );
      // console.log(`Access Token is ::: ${accessToken as string}`);
      userLogger.info(`Received Access Token, next, will make api call...`);

      // gives the ratecard url
      const url = giveRateCardUrl(settings.account_id);
      userLogger.info(`Rate card URL: ${url}`);

      // take the url and auth_acces_token and pass to ratecard url
      const accountRateCard = await getRateCardValuesWithToken(
        url,
        accessToken as string,
      );
      userLogger.info(`Fetched Rate card for account: ${settings.account_id}. Response count: ${accountRateCard.length}`);
      userLogger.info(`Raw rate card response: ${JSON.stringify(accountRateCard)}`);
      rateCardResponse = accountRateCard;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Error while fetching Account Ratecard values";
      userLogger.error(JSON.stringify(error));
      throw new UnsuccessfulActionError(message);
    }
  }

  const validRateCard = findValidRateCard(rateCardResponse);
  const newValidRateCard = reconfigureRateCardCapabilities(validRateCard);
  return { rate_card: newValidRateCard, tag_keys: settings.tag_keys ?? [] };
};
