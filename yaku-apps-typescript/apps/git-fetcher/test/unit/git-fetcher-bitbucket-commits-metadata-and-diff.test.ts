import { fail } from 'assert'
import { beforeEach, describe, expect, it, SpyInstance, vi } from 'vitest'
import { BitbucketResponse } from '../../src/model/bitbucket-response.js'
import { CommitsMetadataAndDiff } from '../../src/model/commits-metadata-and-diff.js'
import { BitbucketCommit } from '../../src/model/bitbucket-commit.js'
import { ConfigFileData } from '../../src/model/config-file-data.js'
import { GitServerConfig } from '../../src/model/git-server-config.js'
import * as responseHandler from '../../src/utils/handle-response-status.js'
import {
  bitBucketCommitsEmptyResponse,
  bitBucketDiffEmptyResponse,
  bitBucketCommitsSinglePageResponse,
  bitBucketDiffNonEmptyPageResponse,
  bitBucketCommitsMultiPageResponse,
} from './fixtures/bitbucket-responses-commits-and-diff.js'
import { GitFetcherBitbucketCommitsAndDiff } from '../../src/fetchers/git-fetcher-bitbucket-commits-and-diff.js'

const gitServerConfigDefault: GitServerConfig = {
  gitServerType: 'bitbucket',
  gitServerApiUrl: ' https://www.foo.bar',
  gitServerAuthMethod: 'basic',
} as const as GitServerConfig

const configDefault: ConfigFileData = {
  data: {
    org: 'foo_org',
    repo: 'foo_repo',
    resource: 'metadata-and-diff',
    filter: {
      startHash: '35cc5eec543e69aed90503f21cf12666bcbfda4f',
    },
    filePath: 'Somefolder/something.py',
  },
} as const

let responseStatusHandlerSpy: SpyInstance
let consoleSpy: SpyInstance
let fetchMock: SpyInstance
let gitFetcherBitbucketCommitsAndDiff: GitFetcherBitbucketCommitsAndDiff

const fetchCommitsUrlMatcher = /\/commits\?path=/
const fetchDiffUrlMatcher = /\/diff\//
const fetchCommitsOrDiffUrlMatcher = /\/commits\?path=|\/diff\//

describe('Git Fetcher Metadata And Diff', () => {
  beforeEach(() => {
    responseStatusHandlerSpy = vi
      .spyOn(responseHandler, 'handleResponseStatus')
      .mockImplementation(() => {
        throw new Error('Mock Error')
      })
    consoleSpy = vi.spyOn(console, 'log')
    fetchMock = vi.spyOn(global, 'fetch')
    gitFetcherBitbucketCommitsAndDiff = new GitFetcherBitbucketCommitsAndDiff(
      gitServerConfigDefault,
      configDefault,
    )
  })

  it('should return empty array when no commits were returned by BitBucket', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toMatch(fetchCommitsOrDiffUrlMatcher)
      if (url.match(fetchCommitsUrlMatcher)) {
        return {
          status: 200,
          json: async () => bitBucketCommitsEmptyResponse,
        }
      }
      if (url.match(fetchDiffUrlMatcher)) {
        return {
          status: 200,
          json: async () => bitBucketDiffEmptyResponse,
        }
      }
    })

    const result: CommitsMetadataAndDiff =
      (await gitFetcherBitbucketCommitsAndDiff.fetchResource()) as CommitsMetadataAndDiff
    expect(fetchMock).toBeCalledTimes(2)
    expect(consoleSpy).toHaveBeenCalledWith('Fetched medata about 0 commits')
    expect(consoleSpy).toHaveBeenCalledWith('Fetched 0 diff')
    expect(result.commitsMetadata).toHaveLength(0)
    expect(result.diff).toHaveLength(0)

    expect(responseStatusHandlerSpy).toBeCalledTimes(0)
  })

  it('should send one request for commits and one request for diff, if the first commits response contains all commits', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toMatch(fetchCommitsOrDiffUrlMatcher)
      if (url.match(fetchCommitsUrlMatcher)) {
        return {
          status: 200,
          json: async () => bitBucketCommitsSinglePageResponse,
        }
      }
      if (url.match(fetchDiffUrlMatcher)) {
        return {
          status: 200,
          json: async () => bitBucketDiffNonEmptyPageResponse,
        }
      }
    })

    const result: CommitsMetadataAndDiff =
      (await gitFetcherBitbucketCommitsAndDiff.fetchResource()) as CommitsMetadataAndDiff
    expect(fetchMock).toBeCalledTimes(2)
    expect(consoleSpy).toHaveBeenCalledWith('Fetched medata about 5 commits')
    expect(consoleSpy).toHaveBeenCalledWith('Fetched 1 diff')
    expect(result.commitsMetadata).toHaveLength(5)
    expect(result.diff).toHaveLength(1)

    expect(responseStatusHandlerSpy).toBeCalledTimes(0)
  })

  it('should send multiple requests, until all commits have been fetched', async () => {
    let queriedFirstPage = false
    let queriedSecondPage = false
    let queriedThirdPage = false
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toMatch(fetchCommitsOrDiffUrlMatcher)
      if (url.match(fetchCommitsUrlMatcher)) {
        let responseBodyToReturn: BitbucketResponse<BitbucketCommit>
        if (url.endsWith('start=0')) {
          responseBodyToReturn = bitBucketCommitsMultiPageResponse[0]
          queriedFirstPage = true
        } else if (url.endsWith('start=2')) {
          responseBodyToReturn = bitBucketCommitsMultiPageResponse[1]
          queriedSecondPage = true
        } else if (url.endsWith('start=4')) {
          responseBodyToReturn = bitBucketCommitsMultiPageResponse[2]
          queriedThirdPage = true
        } else {
          fail(`unexpected url: ${url}`)
        }
        return {
          status: 200,
          json: async () => responseBodyToReturn,
        }
      }
      if (url.match(fetchDiffUrlMatcher)) {
        return {
          status: 200,
          json: async () => bitBucketDiffNonEmptyPageResponse,
        }
      }
    })

    const result: CommitsMetadataAndDiff =
      (await gitFetcherBitbucketCommitsAndDiff.fetchResource()) as CommitsMetadataAndDiff
    expect(fetchMock).toBeCalledTimes(4)
    expect(consoleSpy).toBeCalledWith('Fetched medata about 5 commits')
    expect(consoleSpy).toHaveBeenCalledWith('Fetched 1 diff')
    expect(queriedFirstPage).toBe(true)
    expect(queriedSecondPage).toBe(true)
    expect(queriedThirdPage).toBe(true)
    expect(result.commitsMetadata).toHaveLength(5)
    expect(result.diff).toHaveLength(1)
    expect(result.commitsMetadata).toEqual([
      ...bitBucketCommitsMultiPageResponse[0].values,
      ...bitBucketCommitsMultiPageResponse[1].values,
      ...bitBucketCommitsMultiPageResponse[2].values,
    ])

    expect(responseStatusHandlerSpy).toBeCalledTimes(0)
  })

  it.each([400, 401, 403, 500])(
    'should throw error when BitBucket responds with non-200 code (%d)',
    async (responseCode: number) => {
      fetchMock.mockImplementation(async (url: string) => {
        expect(url).toMatch(fetchCommitsOrDiffUrlMatcher)
        return {
          status: responseCode,
        }
      })

      let errorWasThrown = false
      try {
        await gitFetcherBitbucketCommitsAndDiff.fetchResource()
      } catch (e) {
        errorWasThrown = true
      }
      expect(errorWasThrown).toBe(true)
      expect(responseStatusHandlerSpy).toHaveBeenCalledOnce()
      expect(responseStatusHandlerSpy).toHaveBeenCalledWith(responseCode)
    },
  )
})
