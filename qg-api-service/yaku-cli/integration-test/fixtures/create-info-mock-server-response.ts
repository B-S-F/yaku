import { MockServerOptions } from '../cli/mockserver'

export function createInfoMockServerResponse(port: number): MockServerOptions {
  return {
    port: port,
    responses: {
      [`/api/v1/service/info`]: {
        get: {
          responseStatus: 200,
          responseBody: {
            imageVersion:
              'growpatcrdev.azurecr.io/yaku-core-api-dev:2024-06-12_16-08-47-ebb6281',
            serviceVersion: '0.45.1',
            qgcliVersions: {
              v0: '',
              v1: '2024-06-03_08-15-25-442de8c',
            },
          },
        },
      },
    },
  }
}
