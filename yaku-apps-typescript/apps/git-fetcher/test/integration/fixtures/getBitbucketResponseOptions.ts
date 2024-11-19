// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MockServerOptions } from '../../../../../integration-tests/src/util'
import { BitbucketCommit } from '../../../src/model/bitbucket-commit'
import { BitbucketPr } from '../../../src/model/bitbucket-pr'
import { BitbucketTag } from '../../../src/model/bitbucket-tag'

export const PULL_REQUESTS_ENDPOINT =
  '/projects/aquatest/repos/bitbucket-fetcher-test-repo/pull-requests'

export function requestUrlCommit(commitHash: string): string {
  return `/projects/aquatest/repos/bitbucket-fetcher-test-repo/commits/${commitHash}`
}

export function requestUrlTag(tagName: string): string {
  return `/projects/aquatest/repos/bitbucket-fetcher-test-repo/tags/${tagName}`
}

export function createBitbucketCommits(
  startDate: Date,
  endDate: Date
): [BitbucketCommit, BitbucketCommit] {
  return [
    {
      id: 'c11631a0ddccb9579feae43b949b53c369528f43',
      committerTimestamp: startDate.getTime(),
    },
    {
      id: 'a71631a0dcccb957afeae43b949b53c369528f4f',
      committerTimestamp: endDate.getTime(),
    },
  ]
}

export function createBitbucketTags(
  commits: [BitbucketCommit, BitbucketCommit]
): [BitbucketTag, BitbucketTag] {
  return [
    {
      id: 'refs/tags/tag1',
      displayId: 'tag1',
      type: 'TAG',
      latestCommit: commits[0].id,
      latestChangeset: commits[0].id,
      hash: 'a13dbf0d42971adfc592103941cc7898652f3cbb',
    },
    {
      id: 'refs/tags/tag2',
      displayId: 'tag2',
      type: 'TAG',
      latestCommit: commits[1].id,
      latestChangeset: commits[1].id,
      hash: 'd1994e10bd134e7b1cf25213d3efcb0004226e6f',
    },
  ]
}

export const bitBucketPrs: readonly BitbucketPr[] = [
  {
    id: 1,
    state: 'OPEN',
    updatedDate: 1580515200000, // 01-02-2020
  },
  {
    id: 2,
    state: 'MERGED',
    updatedDate: 1609459200000, // 01-01-2021
  },
  {
    id: 3,
    state: 'OPEN',
    updatedDate: 1651269600000, // 30-04-2022
  },
  {
    id: 4,
    state: 'DECLINED',
    updatedDate: 1678838400000, // 15-03-2023
  },
] as const

export type BitbucketMockConfig = {
  port: number
  pullRequestResponses: BitbucketPr[] | readonly BitbucketPr[]
  commitResponses?: BitbucketCommit[]
  tagResponses?: BitbucketTag[]
}

export function getBitbucketResponseOptions(
  config: BitbucketMockConfig
): MockServerOptions {
  if (config.pullRequestResponses.length > 25) {
    throw new Error('The number of pull requests must not be greater than 25.')
  }
  let response = {
    [PULL_REQUESTS_ENDPOINT]: {
      get: {
        responseStatus: 200,
        responseBody: {
          isLastPage: true,
          limit: 25,
          size: config.pullRequestResponses.length,
          start: 0,
          values: config.pullRequestResponses,
        },
      },
    },
  }

  const commits: BitbucketCommit[] = config.commitResponses ?? []
  commits.forEach((commit) => {
    response = {
      ...response,
      [`/projects/aquatest/repos/bitbucket-fetcher-test-repo/commits/${commit.id}`]:
        {
          get: {
            responseStatus: 200,
            responseBody: commit,
          },
        },
    }
  })

  const tags: BitbucketTag[] = config.tagResponses ?? []
  tags.forEach((tag) => {
    response = {
      ...response,
      [requestUrlTag(tag.displayId)]: {
        get: {
          responseStatus: 200,
          responseBody: tag,
        },
      },
    }
  })
  return {
    port: config.port,
    https: true,
    responses: response,
  }
}
