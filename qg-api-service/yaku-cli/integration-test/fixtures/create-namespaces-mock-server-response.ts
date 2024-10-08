import { MockServerOptions } from '../cli/mockserver'

export function createNamespacesMockServerResponse(
  port: number,
  namespaceId?: number
): MockServerOptions {
  return {
    port: port,
    responses: {
      [`/api/v1/namespaces`]: {
        get: [
          {
            responseStatus: 200,
            responseBody: [
              {
                id: 1,
                name: 'namespace1',
                users: [],
              },
              {
                id: 2,
                name: 'namespace2',
                users: [],
              },
            ],
          },
        ],
        post: [
          {
            responseStatus: 201,
            responseBody: [
              {
                id: 3,
                name: 'namespace3',
                users: [],
              },
            ],
          },
        ],
      },
    },
  }
}
