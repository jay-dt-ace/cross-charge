/**
 * @jest-environment @dynatrace/js-runtime/lib/test-environment
 */

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import getGenericEntityTypes from './get-generic-entity-types.action';

enableFetchMocks();

describe('get-generic-entity-types', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should produce expected results', async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        schemaId: 'get-generic-entity-types-connection',
        value: {
          name: 'My Connection',
          token: 'abc123',
          url: 'https://foo.bar',
        },
        summary: 'My Connection',
      }),
    );
    const result = await getGenericEntityTypes({
      name: 'Mark',
      connectionId: 'get-generic-entity-types-connection-object-id',
    });
    expect(result).toEqual({ message: 'Hello Mark!' });
    expect.assertions(1);
  });
});
