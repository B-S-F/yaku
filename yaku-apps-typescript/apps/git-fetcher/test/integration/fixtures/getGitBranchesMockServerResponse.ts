import { MockServerOptions } from '../../../../../integration-tests/src/util'

export const bitbucketBranchesEndpoint =
  '/projects/aquatest/repos/bitbucket-fetcher-test-repo/branches'

export function getGitBranchesMockServerResponse(
  port: number,
): MockServerOptions {
  return {
    port,
    https: true,
    responses: {
      [bitbucketBranchesEndpoint]: {
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
                  id: 'refs/heads/E2E_Test-150',
                  displayId: 'E2E_Test-150',
                  type: 'BRANCH',
                  latestCommit: '5dda2f9cc6abcb79d8675c20d8ebdab64099362c',
                  latestChangeset: '5dda2f9cc6abcb79d8675c20d8ebdab64099362c',
                  isDefault: false,
                },
                {
                  id: 'refs/heads/E2E_Test-149',
                  displayId: 'E2E_Test-149',
                  type: 'BRANCH',
                  latestCommit: 'c11611a0dcccb9579aeae43b949b53cd69528f43',
                  latestChangeset: 'c11611a0dcccb9579aeae43b949b53cd69528f43',
                  isDefault: false,
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
                  id: 'refs/heads/E2E_Test-148',
                  displayId: 'E2E_Test-148',
                  type: 'BRANCH',
                  latestCommit: '9506c496cf61143c89ce0a3c0ba86bb1596699bb',
                  latestChangeset: '9506c496cf61143c89ce0a3c0ba86bb1596699bb',
                  isDefault: false,
                },
                {
                  id: 'refs/heads/main',
                  displayId: 'main',
                  type: 'BRANCH',
                  latestCommit: '7a9b95c4868e3c6c5633c7959073e95fbe7262cf',
                  latestChangeset: '7a9b95c4868e3c6c5633c7959073e95fbe7262cf',
                  isDefault: true,
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
                  id: 'refs/heads/E2E_Test-147',
                  displayId: 'E2E_Test-147',
                  type: 'BRANCH',
                  latestCommit: '3499c02a0fc8a4133b84610a1d85f93e7c848bcf',
                  latestChangeset: '3499c02a0fc8a4133b84610a1d85f93e7c848bcf',
                  isDefault: false,
                },
              ],
            },
          },
        ],
      },
    },
  }
}

export function getGitBranchesErrorMockServerResponse(
  port: number,
): MockServerOptions {
  return {
    port,
    https: true,
    responses: {
      [bitbucketBranchesEndpoint]: {
        get: {
          responseStatus: 404,
        },
      },
    },
  }
}
