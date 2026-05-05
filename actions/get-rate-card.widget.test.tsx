import { render } from '@dynatrace/strato-components-preview-testing/jest';
import { type IntentPayload } from '@dynatrace-sdk/navigation';
import { mockNavigation } from '@dynatrace-sdk/navigation/testing';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import React from 'react';
import GetRateCardWidget from './get-rate-card.widget';

enableFetchMocks();

describe('GetRateCardWidget', () => {
  beforeEach(() => {
    fetchMock.resetMocks();

    // Mock the `getIntentLink` value to be a valid URL.
    mockNavigation({
      getIntentLink: (_intentPayload: IntentPayload, _appId?: string, _intentId?: string) => 'https://mock.url',
    });
  });

  it('should render a widget with values', () => {
    // Mock settings objects response value.
    fetchMock.mockIf(
      new RegExp('/platform/app-settings/v1/objects'),
      JSON.stringify({
        items: [
          {
            objectId: 'get-rate-card-connection-object-id',
            summary: 'My Connection',
          },
        ],
        totalCount: 1,
        pageSize: 100,
      }),
    );
    render(
      <GetRateCardWidget value={{ connectionId: 'get-rate-card-connection-object-id' }} onValueChanged={jest.fn()} />,
    );
  });
});
