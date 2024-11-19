// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MockServerOptions } from '../../../../../integration-tests/src/util'

export function getGitPullRequestsMockOptions(
  port: number,
  responseStatus: number,
): MockServerOptions {
  return {
    port: port,
    https: true,
    responses: {
      [`/projects/aquatest/repos/bitbucket-fetcher-test-repo/pull-requests`]: {
        get: {
          responseStatus: responseStatus,
          responseBody: {
            isLastPage: true,
            limit: 25,
            size: 2,
            start: 0,
            values: [
              {
                id: 1,
                title: 'foo 1',
              },
              {
                id: 2,
                title: 'foo 2',
              },
            ],
          },
        },
      },
      [`/repos/aquatest/github-fetcher-test-repo/pulls`]: {
        get: [
          {
            responseStatus: responseStatus,
            responseBody: [
              {
                id: 1,
                title: 'Dummy PR',
                state: 'open',
                labels: [
                  {
                    id: 1,
                    url: 'www.foo.bar',
                    name: 'ignore',
                    default: false,
                  },
                ],
              },
            ],
          },
          {
            responseStatus: responseStatus,
            responseBody: [],
          },
        ],
      },
    },
  }
}
