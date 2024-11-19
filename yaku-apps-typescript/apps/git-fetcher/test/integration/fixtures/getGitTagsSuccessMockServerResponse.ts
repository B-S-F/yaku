import { MockServerOptions } from '../../../../../integration-tests/src/util'

export const bitbucketTagsEndpoint =
  '/projects/aquatest/repos/bitbucket-fetcher-test-repo/tags'

export function getGitTagsSuccessMockServerResponse(
  port: number,
): MockServerOptions {
  return {
    port,
    https: true,
    responses: {
      [bitbucketTagsEndpoint]: {
        get: [
          {
            responseStatus: 200,
            responseBody: {
              size: 2,
              limit: 2,
              start: 0,
              isLastPage: false,
              nextPageStart: 2,
              values: [
                {
                  id: 'refs/tags/E2E_Test-150',
                  displayId: 'E2E_Test-150',
                  type: 'TAG',
                  latestCommit: '5dda2f9cc6abcb79d8675c20d8ebdab64099362c',
                  latestChangeset: '5dda2f9cc6abcb79d8675c20d8ebdab64099362c',
                  hash: 'a13dbf0d42971adfc592103941cc7898652f3cbb',
                },
                {
                  id: 'refs/tags/E2E_Test-149',
                  displayId: 'E2E_Test-149',
                  type: 'TAG',
                  latestCommit: '68521d211c5e38c27381718149014c5ec20b1f8e',
                  latestChangeset: '68521d211c5e38c27381718149014c5ec20b1f8e',
                  hash: 'd1994e10bd134e7b1cf25213d3efcb0004226e6f',
                },
              ],
            },
          },
          {
            responseStatus: 200,
            responseBody: {
              size: 2,
              limit: 2,
              start: 2,
              isLastPage: false,
              nextPageStart: 4,
              values: [
                {
                  id: 'refs/tags/E2E_Test-148',
                  displayId: 'E2E_Test-148',
                  type: 'TAG',
                  latestCommit: '9506c496cf61143c89ce0a3c0ba86bb1596699bb',
                  latestChangeset: '9506c496cf61143c89ce0a3c0ba86bb1596699bb',
                  hash: '0efcb08a881c07bf2abaebd3858e01f8f0133628',
                },
                {
                  id: 'refs/tags/E2E_Test-147',
                  displayId: 'E2E_Test-147',
                  type: 'TAG',
                  latestCommit: '3499c02a0fc8a4133b84610a1d85f93e7c848bcf',
                  latestChangeset: '3499c02a0fc8a4133b84610a1d85f93e7c848bcf',
                  hash: '36aa763314d8e8bdaf35a63a676dd5742f9e93bd',
                },
              ],
            },
          },
          {
            responseStatus: 200,
            responseBody: {
              size: 1,
              limit: 2,
              start: 4,
              isLastPage: true,
              values: [
                {
                  id: 'refs/tags/other',
                  displayId: 'other',
                  type: 'TAG',
                  latestCommit: '2ff330ca717c86365505fa3b21cd81559c288274',
                  latestChangeset: '2ff330ca717c86365505fa3b21cd81559c288274',
                  hash: 'da27dfc61b069c6f0d91e107e166d0e09d7e1a03',
                },
              ],
            },
          },
        ],
      },
    },
  }
}

export function getGitTagsErrorMockServerResponse(
  port: number,
): MockServerOptions {
  return {
    port,
    https: true,
    responses: {
      [bitbucketTagsEndpoint]: {
        get: {
          responseStatus: 404,
        },
      },
    },
  }
}
