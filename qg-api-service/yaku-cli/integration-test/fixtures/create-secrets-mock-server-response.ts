import { MockServerOptions, ServerHost } from '../cli/mockserver'

export function createSecretsMockServerResponse(
  namespaceId: number,
  port: number,
  name?: string
): MockServerOptions {
  const serverHost: ServerHost = new ServerHost(
    'http',
    'localhost',
    String(port),
    '/api/v1'
  )
  return {
    port: port,
    responses: {
      [`/api/v1/namespaces/${namespaceId}/secrets`]: {
        get: [
          {
            responseStatus: 200,
            responseBody: {
              pagination: {
                pageNumber: 1,
                pageSize: 20,
                totalCount: 2,
              },
              data: [
                {
                  creationTime: '2024-02-09T06:26:18.933Z',
                  description: 'Github Token',
                  lastModificationTime: '2024-02-09T06:26:18.933Z',
                  name: 'GITHUB_TOKEN',
                },
                {
                  creationTime: '2024-02-09T06:26:18.933Z',
                  description: 'Artifactory Username',
                  lastModificationTime: '2024-02-09T06:26:18.933Z',
                  name: 'ARTIFACTORY_USERNAME',
                },
              ],
              links: {
                first: `${serverHost.getApiEndpoint()}/namespaces/${namespaceId}/secrets?page=1&items=20`,
                last: `${serverHost.getApiEndpoint()}/namespaces/${namespaceId}/secrets?page=1&items=20`,
                next: `${serverHost.getApiEndpoint()}/namespaces/${namespaceId}/secrets?page=1&items=20`,
              },
            },
          },
          {
            responseStatus: 200,
            responseBody: {
              pagination: {
                pageNumber: 1,
                pageSize: 20,
                totalCount: 1,
              },
              data: [
                {
                  creationTime: '2024-02-09T06:26:18.933Z',
                  description: 'Github Token',
                  lastModificationTime: '2024-02-09T06:26:18.933Z',
                  name: 'GITHUB_TOKEN',
                },
              ],
              links: {
                first: `${serverHost.getApiEndpoint()}/namespaces/${namespaceId}/secrets?page=1&items=1`,
                last: `${serverHost.getApiEndpoint()}/namespaces/${namespaceId}/secrets?page=2&items=1`,
                next: `${serverHost.getApiEndpoint()}/namespaces/${namespaceId}/secrets?page=2&items=1`,
              },
            },
          },
        ],
        post: [
          {
            responseStatus: 201,
            responseBody: {
              creationTime: '2024-02-09T06:26:18.933Z',
              description: 'some secret',
              lastModificationTime: '2024-02-09T06:26:18.933Z',
              name: 'TEMP_SEC',
            },
          },
          {
            responseStatus: 400,
            responseBody: {
              message:
                'The name of a secret can only contain upper case letters, numbers and underscore. It has to start with a letter or an underscore.',
            },
          },
        ],
      },
      [`/api/v1/namespaces/${namespaceId}/secrets/${name}`]: {
        patch: [
          {
            responseStatus: 200,
            responseBody: {
              creationTime: '2024-02-09T06:26:18.933Z',
              description: 'some secret',
              lastModificationTime: '2024-02-09T06:26:18.933Z',
              name: 'TEMP_SEC',
            },
          },
        ],
        delete: [
          {
            responseStatus: 200,
            responseBody: {
              message: 'Secret TEMP_SEC was successfully deleted',
            },
          },
        ],
      },
    },
  }
}
