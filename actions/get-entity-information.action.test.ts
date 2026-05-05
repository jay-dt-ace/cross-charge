/**
 * @jest-environment @dynatrace/js-runtime/lib/test-environment
 */

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import getEntityInformation from './get-entity-information.action';

enableFetchMocks();

describe('get-entity-information', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should produce expected results', async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        schemaId: 'get-entity-information-connection',
        value: {
          name: 'My Connection',
          token: 'abc123',
          url: 'https://foo.bar',
        },
        summary: 'My Connection',
      }),
    );
    // eslint-disable-next-line
    const result = await getEntityInformation({
      name: 'Mark',
      connectionId: 'get-entity-information-connection-object-id',
    });
    expect(result).toEqual({ message: 'Hello Mark!' });
    expect.assertions(1);
  });
});
