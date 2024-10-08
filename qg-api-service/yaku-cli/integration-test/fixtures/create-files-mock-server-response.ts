import { MockServerOptions, ServerHost } from '../cli/mockserver'

export function createFilesMockServerResponse(
  namespaceId: number,
  configId: number,
  port: number,
  filename?: string
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
      [`/api/v1/namespaces/${namespaceId}/configs/${configId}`]: {
        get: [
          {
            responseStatus: 200,
            responseBody: {
              id: `${configId}`,
              name: 'test-config-name',
              creationTime: '2024-08-20T06:26:57.504Z',
              lastModificationTime: '2024-08-20T06:28:19.461Z',
              files: {
                qgConfig: `https://yaku-dev.bswf.tech/api/v1/namespaces/${namespaceId}/configs/${configId}/files/testingFilename`,
              },
            },
          },
          {
            responseStatus: 200,
            responseBody: {
              id: `${configId}`,
              name: 'test-config-name',
              creationTime: '2024-08-20T06:26:57.504Z',
              lastModificationTime: '2024-08-20T06:28:19.461Z',
              files: {
                qgConfig: `https://yaku-dev.bswf.tech/api/v1/namespaces/${namespaceId}/configs/${configId}/files/testingFilename`,
              },
            },
          },
        ],
      },
      [`/api/v1/namespaces/${namespaceId}/configs/${configId}/files`]: {
        post: [
          {
            responseStatus: 201,
          },
        ],
      },
      [`/api/v1/namespaces/${namespaceId}/configs/${configId}/files/${filename}`]:
        {
          patch: [
            {
              responseStatus: 200,
            },
          ],
          get: [
            {
              responseStatus: 200,
              responseHeaders: {
                'Content-Disposition': `attachment; filename="${filename}"; filename*="${filename}"`,
              },
              responseBody: 'binary',
            },
          ],
          delete: [
            {
              responseStatus: 200,
            },
          ],
        },
    },
  }
}
