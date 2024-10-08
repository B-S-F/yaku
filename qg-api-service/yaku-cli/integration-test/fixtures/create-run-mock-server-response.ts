import { MockServerOptions } from '../cli/mockserver'

export function createRunMockServerResponse(
  port: number,
  nameSpaceId: number,
  runId: number
): MockServerOptions {
  return {
    port: port,
    responses: {
      [`/api/v1/namespaces/${nameSpaceId}/runs`]: {
        post: {
          responseStatus: 200,
          responseBody: {
            id: runId,
            status: 'running',
            config: 'dummyConfig',
            creationTime: new Date(),
          },
        },
      },
      [`/api/v1/namespaces/${nameSpaceId}/runs/${runId}`]: {
        get: {
          responseStatus: 200,
          responseBody: {
            id: runId,
            status: 'completed',
            config: 'dummyConfig',
            creationTime: new Date(),
          },
        },
      },
    },
  }
}
