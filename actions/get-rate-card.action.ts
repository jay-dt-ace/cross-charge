import {
  UnsuccessfulActionError,
  userLogger,
} from "@dynatrace-sdk/automation-action-utils/actions";
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

const SSO_URL = "https://sso.dynatrace.com/sso/oauth2/token";

function giveRateCardUrl(accoundId: string) {
  return `https://api.dynatrace.com/sub/v1/accounts/${accoundId}/rate-cards`;
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
  let validRateCard: RateCardResponse = {
    quoteNumber: "",
    currencyCode: "",
    startTime: "",
    endTime: "",
    capabilities: [],
  };

  let foundValidCard = false;
  const today = new Date().getTime();

  for (const rateCard of rateCardResponse) {
    const start = Date.parse(rateCard.startTime);
    const end = Date.parse(rateCard.endTime);

    if (start <= today && today <= end) {
      foundValidCard = true;
      validRateCard = rateCard;
    }
  }

  if (!foundValidCard && rateCardResponse.length > 0 && rateCardResponse[0]) {
    // defaults to the first rate card in the response if the timeframe can't be validated
    validRateCard = rateCardResponse[0];
  }

  // console.log(validRateCard);
  return validRateCard;
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
        SSO_URL,
        settings.client_id,
        settings.client_secret,
        resource,
      );
      // console.log(`Access Token is ::: ${accessToken as string}`);
      userLogger.info(`Received Access Token, next, will make api call...`);

      // gives the ratecard url
      const url = giveRateCardUrl(settings.account_id);
      // console.warn(`Rate card url is ${url}`);

      // take the url and auth_acces_token and pass to ratecard url
      const accountRateCard = await getRateCardValuesWithToken(
        url,
        accessToken as string,
      );
      userLogger.info(`Fetched Rate card for account: ${settings.account_id}`);
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
