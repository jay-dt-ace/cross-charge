/**
 * @jest-environment @dynatrace/js-runtime/lib/test-environment
 */

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import sendBizevent from './send-bizevent.action';

enableFetchMocks();

describe('send-bizevent', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should produce expected results', async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        schemaId: 'send-bizevent-connection',
        value: {
          name: 'My Connection',
          token: 'abc123',
          url: 'https://foo.bar',
        },
        summary: 'My Connection',
      }),
    );
    const result = await sendBizevent({ name: 'Mark', connectionId: 'send-bizevent-connection-object-id' });
    expect(result).toEqual({ message: 'Hello Mark!' });
    expect.assertions(1);
  });
});
