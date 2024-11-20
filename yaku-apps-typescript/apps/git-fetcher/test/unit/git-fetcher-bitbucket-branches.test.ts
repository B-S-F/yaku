// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { fail } from 'assert'
import { beforeEach, describe, expect, it, SpyInstance, vi } from 'vitest'
import { GitFetcherBitbucketTagsAndBranches } from '../../src/fetchers/git-fetcher-bitbucket-tags-and-branches'
import { BitbucketResponse } from '../../src/model/bitbucket-response'
import { BitbucketBranch } from '../../src/model/bitbucket-branch'
import { ConfigFileData } from '../../src/model/config-file-data'
import { GitServerConfig } from '../../src/model/git-server-config'
import {
  bitBucketBranchEmptyResponse,
  bitBucketBranchMultiPageResponse,
  bitBucketBranchSinglePageResponse,
} from './fixtures/bitbucket-responses-branches'
import * as responseHandler from '../../src/utils/handle-response-status'

const gitServerConfigDefault: GitServerConfig = {
  gitServerType: 'bitbucket',
  gitServerApiUrl: ' https://www.foo.bar',
  gitServerAuthMethod: 'basic',
} as const as GitServerConfig

const configDefault: ConfigFileData = {
  data: {
    org: 'foo_org',
    repo: 'foo_repo',
    resource: 'branches',
  },
} as const

let responseStatusHandlerSpy: SpyInstance
let consoleSpy: SpyInstance
let fetchMock: SpyInstance
let gitFetcherBitBucketBranches: GitFetcherBitbucketTagsAndBranches

const fetchUrlMatcher = /\/branches\?start=\d+$/

describe('Git Fetcher BitBucket Branches', () => {
  beforeEach(() => {
    responseStatusHandlerSpy = vi
      .spyOn(responseHandler, 'handleResponseStatus')
      .mockImplementation(() => {
        throw new Error('MockError')
      })
    consoleSpy = vi.spyOn(console, 'log')
    fetchMock = vi.spyOn(global, 'fetch')
    gitFetcherBitBucketBranches = new GitFetcherBitbucketTagsAndBranches(
      gitServerConfigDefault,
      configDefault,
      'branches',
    )
  })

  it('should return empty array when no branches were returned by BitBucket', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toMatch(fetchUrlMatcher)
      return {
        status: 200,
        json: async () => bitBucketBranchEmptyResponse,
      }
    })

    const result: BitbucketBranch[] =
      (await gitFetcherBitBucketBranches.fetchResource()) as BitbucketBranch[]
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(consoleSpy).toHaveBeenCalledWith('Fetched 0 branches')
    expect(result).toHaveLength(0)

    expect(responseStatusHandlerSpy).toBeCalledTimes(0)
  })

  it('should send exactly one request, if the first response contains all branches', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toMatch(fetchUrlMatcher)
      return {
        status: 200,
        json: async () => bitBucketBranchSinglePageResponse,
      }
    })

    const result: BitbucketBranch[] =
      (await gitFetcherBitBucketBranches.fetchResource()) as BitbucketBranch[]
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(consoleSpy).toHaveBeenCalledWith('Fetched 1 branch')
    expect(result).toHaveLength(1)
    expect(result).toEqual(bitBucketBranchSinglePageResponse.values)

    expect(responseStatusHandlerSpy).toBeCalledTimes(0)
  })

  it('should send multiple requests, until all branches have been fetched', async () => {
    let queriedFirstPage = false
    let queriedSecondPage = false
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toMatch(fetchUrlMatcher)
      let responseBodyToReturn: BitbucketResponse<BitbucketBranch>
      if (url.endsWith('start=0')) {
        responseBodyToReturn = bitBucketBranchMultiPageResponse[0]
        queriedFirstPage = true
      } else if (url.endsWith('start=1')) {
        responseBodyToReturn = bitBucketBranchMultiPageResponse[1]
        queriedSecondPage = true
      } else {
        fail(`unexpected url: ${url}`)
      }
      return {
        status: 200,
        json: async () => responseBodyToReturn,
      }

      const result: BitbucketBranch[] =
        (await gitFetcherBitBucketBranches.fetchResource()) as BitbucketBranch[]
      expect(fetchMock).toBeCalledTimes(2)
      expect(consoleSpy).toBeCalledWith('Fetched 2 branches')
      expect(queriedFirstPage).toBe(true)
      expect(queriedSecondPage).toBe(true)
      expect(result).toHaveLength(2)
      expect(result).toEqual([
        ...bitBucketBranchMultiPageResponse[0].values,
        ...bitBucketBranchMultiPageResponse[1].values,
      ])

      expect(responseStatusHandlerSpy).toBeCalledTimes(0)
    })
  })

  it.each([400, 401, 403, 500])(
    'should throw error when BitBucket responds with non-200 code (%d)',
    async (responseCode: number) => {
      fetchMock.mockImplementation(async (url: string) => {
        expect(url).toMatch(fetchUrlMatcher)
        return {
          status: responseCode,
        }
      })

      let errorWasThrown = false
      try {
        await gitFetcherBitBucketBranches.fetchResource()
      } catch (e) {
        errorWasThrown = true
      }
      expect(errorWasThrown).toBe(true)
      expect(responseStatusHandlerSpy).toHaveBeenCalledOnce()
      expect(responseStatusHandlerSpy).toHaveBeenCalledWith(responseCode)
    },
  )
})
