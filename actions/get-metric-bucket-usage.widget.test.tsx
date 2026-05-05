import { render } from '@dynatrace/strato-components-preview-testing/jest';
import { type IntentPayload } from '@dynatrace-sdk/navigation';
import { mockNavigation } from '@dynatrace-sdk/navigation/testing';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import React from 'react';
import GetMetricBucketUsageWidget from './get-metric-bucket-usage.widget';

enableFetchMocks();

describe('GetMetricBucketUsageWidget', () => {
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
            objectId: 'get-metric-bucket-usage-connection-object-id',
            summary: 'My Connection',
          },
        ],
        totalCount: 1,
        pageSize: 100,
      }),
    );
    render(<GetMetricBucketUsageWidget value={{ name: 'Mark' }} onValueChanged={jest.fn()} />);
  });
});
