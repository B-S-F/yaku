import { MockServerOptions } from '../../../../../integration-tests/src/util'

export function getEmptySearchMockOptions(port: number): MockServerOptions {
  return {
    port: port,
    https: true,
    responses: {
      [`/rest/api/2/search`]: {
        post: [
          {
            responseStatus: 200,
            responseBody: {
              issues: [],
            },
          },
        ],
      },
    },
  }
}
