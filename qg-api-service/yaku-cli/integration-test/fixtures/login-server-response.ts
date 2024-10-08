import { MockServerOptions } from '../cli/mockserver'

export function loginMockServerResponse(port: number): MockServerOptions {
  return {
    port: port,
    responses: {
      [`/api/v1/long-running-tokens`]: {
        get: [
          {
            responseStatus: 200,
            responseBody: {
              pagination: {
                pageNumber: 1,
                pageSize: 1,
                totalCount: 1,
              },
              data: [
                {
                  id: 1,
                  description: 'this is a token',
                  try_admin: false,
                  createdBy: 'simpleuser@bosch.com',
                  creationTime: '2024-08-13T11:22:17.507Z',
                  lastModifiedBy: 'simpleuser@bosch.com',
                  lastModificationTime: '2024-08-13T11:22:17.507Z',
                  status: 'active',
                },
              ],
              links: {
                first:
                  'https://localhost:3000/api/v1/long-running-tokens?page=1&items=20',
                last: 'https://localhost:3000/api/v1/long-running-tokens?page=1&items=20',
              },
            },
          },
        ],
      },
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
            ],
          },
        ],
      },
    },
  }
}
