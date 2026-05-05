/**
 * @jest-environment @dynatrace/js-runtime/lib/test-environment
 */

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import getEntities from './get-entities.action';

enableFetchMocks();

describe('get-entities', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should produce expected results', async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        schemaId: 'get-entities-connection',
        value: {
          name: 'My Connection',
          token: 'abc123',
          url: 'https://foo.bar',
        },
        summary: 'My Connection',
      }),
    );
    const result = await getEntities({ name: 'Mark', connectionId: 'get-entities-connection-object-id' });
    expect(result).toEqual({ message: 'Hello Mark!' });
    expect.assertions(1);
  });
});
