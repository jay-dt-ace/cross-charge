/**
 * @jest-environment @dynatrace/js-runtime/lib/test-environment
 */

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import getMetricBucketUsage from './get-metric-bucket-usage.action';

enableFetchMocks();

describe('get-metric-bucket-usage', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should produce expected results', async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        schemaId: 'get-metric-bucket-usage-connection',
        value: {
          name: 'My Connection',
          token: 'abc123',
          url: 'https://foo.bar',
        },
        summary: 'My Connection',
      }),
    );
    const result = await getMetricBucketUsage({
      name: 'Mark',
      connectionId: 'get-metric-bucket-usage-connection-object-id',
    });
    expect(result).toEqual({ message: 'Hello Mark!' });
    expect.assertions(1);
  });
});
