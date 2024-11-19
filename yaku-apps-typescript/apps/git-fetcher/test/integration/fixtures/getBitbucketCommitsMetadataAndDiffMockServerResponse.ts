// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MockServerOptions } from '../../../../../integration-tests/src/util'

export const bitbucketCommitsMetadataEndpoint =
  '/projects/aquatest/repos/bitbucket-fetcher-test-repo/commits'

export const bitbucketDiffEndpoint =
  '/projects/aquatest/repos/bitbucket-fetcher-test-repo/diff/Somefolder/something.py'

export function getGitCommitsMetadataAndDiffMockServerResponse(
  port: number
): MockServerOptions {
  return {
    port,
    https: true,
    responses: {
      [bitbucketCommitsMetadataEndpoint]: {
        get: [
          {
            responseStatus: 200,
            responseBody: {
              values: [
                {
                  id: 'f5d0053ff3879c01edfd268e4d88e46747e99370',
                  displayId: 'f5d0053ff38',
                  author: {
                    name: 'Tech User',
                    emailAddress: 'tech.user@example.com',
                  },
                  authorTimestamp: 1690382590000,
                  committer: {
                    name: 'Tech User',
                    emailAddress: 'tech.user@example.com',
                  },
                  committerTimestamp: 1690382590000,
                  message: 'commit for integration tests 1',
                  parents: [
                    {
                      id: 'ba414b6a0eede7338bd0a971b0c0b6076342e7a4',
                      displayId: 'ba414b6a0ee',
                    },
                  ],
                },
                {
                  id: 'ba414b6a0eede7338bd0a971b0c0b6076342e7a4',
                  displayId: 'ba414b6a0ee',
                  author: {
                    name: 'Tech User',
                    emailAddress: 'tech.user@example.com',
                  },
                  authorTimestamp: 1690367674000,
                  committer: {
                    name: 'Tech User',
                    emailAddress: 'tech.user@example.com',
                  },
                  committerTimestamp: 1690367674000,
                  message: 'add new commit for integration tests',
                  parents: [
                    {
                      id: 'b94be7709aecbb65d5cd69f760c61a8fe740eda4',
                      displayId: 'b94be7709ae',
                    },
                  ],
                },
              ],
              size: 2,
              isLastPage: false,
              start: 0,
              limit: 2,
              nextPageStart: 2,
            },
          },
          {
            responseStatus: 200,
            responseBody: {
              values: [
                {
                  id: 'b94be7709aecbb65d5cd69f760c61a8fe740eda4',
                  displayId: 'b94be7709ae',
                  author: {
                    name: 'Tech User',
                    emailAddress: 'tech.user@example.com',
                  },
                  authorTimestamp: 1690367578000,
                  committer: {
                    name: 'Tech User',
                    emailAddress: 'tech.user@example.com',
                  },
                  committerTimestamp: 1690367578000,
                  message: 'modify file for integration tests',
                  parents: [
                    {
                      id: '19e27ca09fb986d1810b531dfca18dbfc927f906',
                      displayId: '19e27ca09fb',
                    },
                  ],
                },
                {
                  id: '19e27ca09fb986d1810b531dfca18dbfc927f906',
                  displayId: '19e27ca09fb',
                  author: {
                    name: 'Tech User',
                    emailAddress: 'tech.user@example.com',
                  },
                  authorTimestamp: 1688124368000,
                  committer: {
                    name: 'Tech User',
                    emailAddress: 'tech.user@example.com',
                  },
                  committerTimestamp: 1688124368000,
                  message: 'modify file to test api functionality',
                  parents: [
                    {
                      id: '2844c40eea52eb6868679415e017e16a1c4d5a31',
                      displayId: '2844c40eea5',
                    },
                  ],
                },
              ],
              size: 2,
              isLastPage: false,
              start: 2,
              limit: 2,
              nextPageStart: 4,
            },
          },
          {
            responseStatus: 200,
            responseBody: {
              values: [
                {
                  id: '2844c40eea52eb6868679415e017e16a1c4d5a31',
                  displayId: '2844c40eea5',
                  author: {
                    name: 'Tech User',
                    emailAddress: 'tech.user@example.com',
                  },
                  authorTimestamp: 1688046420000,
                  committer: {
                    name: 'Tech User',
                    emailAddress: 'tech.user@example.com',
                  },
                  committerTimestamp: 1688046420000,
                  message: 'add changes to test the api',
                  parents: [
                    {
                      id: '35cc5eec543e69aed90503f21cf12666bcbfda4f',
                      displayId: '35cc5eec543',
                    },
                  ],
                },
              ],
              size: 1,
              isLastPage: true,
              start: 4,
              limit: 2,
              nextPageStart: null,
            },
          },
        ],
      },
      [bitbucketDiffEndpoint]: {
        get: [
          {
            responseStatus: 200,
            responseBody: {
              fromHash: '35cc5eec543e69aed90503f21cf12666bcbfda4f',
              toHash: 'master',
              contextLines: 10,
              whitespace: 'SHOW',
              diffs: [
                {
                  source: {
                    components: ['Some folder', 'something.py'],
                    parent: 'Some folder',
                    name: 'something.py',
                    extension: 'py',
                    toString: 'Some folder/something.py',
                  },
                  destination: {
                    components: ['Some folder', 'something.py'],
                    parent: 'Some folder',
                    name: 'something.py',
                    extension: 'py',
                    toString: 'Some folder/something.py',
                  },
                  hunks: [
                    {
                      sourceLine: 1,
                      sourceSpan: 1,
                      destinationLine: 1,
                      destinationSpan: 4,
                      segments: [
                        {
                          type: 'REMOVED',
                          lines: [
                            {
                              source: 1,
                              destination: 1,
                              line: 'print("Hello world!")',
                              truncated: false,
                            },
                          ],
                          truncated: false,
                        },
                        {
                          type: 'ADDED',
                          lines: [
                            {
                              source: 2,
                              destination: 1,
                              line: 'print("Hello world! + some changes")',
                              truncated: false,
                            },
                            {
                              source: 2,
                              destination: 2,
                              line: 'print("another line to test")',
                              truncated: false,
                            },
                            {
                              source: 2,
                              destination: 3,
                              line: 'print("delete previous line and addd this one for integration tests")',
                              truncated: false,
                            },
                            {
                              source: 2,
                              destination: 4,
                              line: 'print("another line")',
                              truncated: false,
                            },
                          ],
                          truncated: false,
                        },
                      ],
                      truncated: false,
                    },
                  ],
                  truncated: false,
                },
              ],
              truncated: false,
            },
          },
        ],
      },
    },
  }
}

export function getGitCommitsMetadataAndDiffErrorMockServerResponse(
  port: number
): MockServerOptions {
  return {
    port,
    https: true,
    responses: {
      [bitbucketCommitsMetadataEndpoint]: {
        get: {
          responseStatus: 404,
        },
      },
    },
  }
}
