import { UnsuccessfulActionError, userLogger } from '@dynatrace-sdk/automation-action-utils/actions';
import { appSettingsObjectsClient, type AppSettingsObject } from '@dynatrace-sdk/client-app-settings-v2';
import { businessEventsClient, type CloudEvent } from '@dynatrace-sdk/client-classic-environment-v2';
import { giveMeaningFullErrorMessage } from '../ui/app/utils/helpers';
import { sendBizEventSchema } from '../ui/shared/types/send-bizevent';

interface BizEventsSettingsType {
  url: string;
  token: string;
}

const buildBizEventUrl = (url: string) => {
  return `${url}/api/v2/bizevents/ingest`;
};

async function sendBizEventsRemote(rawPayload: unknown, connectionObject: AppSettingsObject) {
  const payload = sendBizEventSchema.parse(rawPayload);

  if (!connectionObject.value) {
    throw new UnsuccessfulActionError('Could not find Configuration');
  }

  const fullUrl = buildBizEventUrl(connectionObject.value.url as string);
  for (const bizevent of payload.bizeventRef) {
    try {
      const bizEventReponse = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json; charset=utf-8',
          'Authorization': `Api-Token ${connectionObject.value.token as string}`,
          'Content-Type': 'application/cloudevent+json',
        },
        body: JSON.stringify(bizevent),
      });
      if (bizEventReponse.status > 300) {
        userLogger.error(bizEventReponse.status.toString() + ' : ' + bizEventReponse.statusText);
      }
      userLogger.info('Successfully ingested bizevents from CrossCharge:Workflow App');
    } catch (e: unknown) {
      const message = giveMeaningFullErrorMessage(e);
      userLogger.error('Failed to ingest bizevent to remote environment: ' + message);
      throw new UnsuccessfulActionError(`Failed to ingest bizevent to remote environment:${message}`);
    }
  }
}

async function sendBizEventsLocal(rawPayload: unknown) {
  const payload = sendBizEventSchema.parse(rawPayload);
  for (const bizevent of payload.bizeventRef) {
    const castedBizevent = bizevent as CloudEvent;
    try {
      await businessEventsClient.ingest({
        body: castedBizevent,
        type: 'application/cloudevent+json',
      });
      userLogger.info('Successfully ingested bizevents from CrossCharge:Workflow App');
    } catch (e: unknown) {
      const message = giveMeaningFullErrorMessage(e);
      userLogger.error('Failed to ingest bizevent to local environment: ' + message);
      throw new UnsuccessfulActionError(`Failed to ingest bizevent to local environment:${message}`);
    }
  }
}

const getConnectionObject = async (connectionId: string) => {
  const settingsResponse = await appSettingsObjectsClient.getAppSettingsObjectByObjectId({
    objectId: connectionId,
  });

  if (!settingsResponse.value) {
    throw new UnsuccessfulActionError('Configuration not found.');
  }

  const settings = settingsResponse.value as BizEventsSettingsType;
  if (!settings.url) {
    throw new UnsuccessfulActionError("Missing required field: 'url'.");
  }
  if (!settings.token) {
    throw new UnsuccessfulActionError("Missing required field: 'token'.");
  }

  return settingsResponse;
};

export default async (rawPayload: unknown) => {
  try {
    const payload = sendBizEventSchema.parse(rawPayload);

    // if (!payload.bizevent_ref) {
    //   throw new Error("Input field 'Billing Usage Reference' is missing.");
    // }
    if (!payload.connectionId && !payload.localIngest) {
      throw new UnsuccessfulActionError("Input field 'connectionId' is missing.");
    }

    if (!payload.localIngest && payload.connectionId) {
      // Retrieves the app settings object associated with the given objectId.
      // Its values can be later used to, for example, communicate with third party services.
      const connectionObject = await getConnectionObject(payload.connectionId);

      await sendBizEventsRemote(rawPayload, connectionObject);
    } else {
      await sendBizEventsLocal(rawPayload);
    }
  } catch (error) {
    console.log(error);
    const message = giveMeaningFullErrorMessage(error);
    userLogger.error(message);
    throw new UnsuccessfulActionError(`Error processing BizEvents: ${message}`);
  }
};
