// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { fail } from 'assert'
import { beforeEach, describe, expect, it, SpyInstance, vi } from 'vitest'
import { BitbucketResponse } from '../../src/model/bitbucket-response.js'
import { BitbucketTag } from '../../src/model/bitbucket-tag'
import { ConfigFileData } from '../../src/model/config-file-data'
import { GitServerConfig } from '../../src/model/git-server-config'
import * as responseHandler from '../../src/utils/handle-response-status'
import {
  bitBucketTagEmptyResponse,
  bitBucketTagMultiPageResponse,
  bitBucketTagSinglePageResponse,
} from './fixtures/bitbucket-responses-tags'
import { GitFetcherBitbucketTagsAndBranches } from '../../src/fetchers/git-fetcher-bitbucket-tags-and-branches'

const gitServerConfigDefault: GitServerConfig = {
  gitServerType: 'bitbucket',
  gitServerApiUrl: ' https://www.foo.bar',
  gitServerAuthMethod: 'basic',
} as const as GitServerConfig

const configDefault: ConfigFileData = {
  data: {
    org: 'foo_org',
    repo: 'foo_repo',
    resource: 'tags',
  },
} as const

let responseStatusHandlerSpy: SpyInstance
let consoleSpy: SpyInstance
let fetchMock: SpyInstance
let gitFetcherBitBucketTags: GitFetcherBitbucketTagsAndBranches

const fetchUrlMatcher = /\/tags\?start=\d+$/

describe('Git Fetcher BitBucket Tags', () => {
  beforeEach(() => {
    responseStatusHandlerSpy = vi
      .spyOn(responseHandler, 'handleResponseStatus')
      .mockImplementation(() => {
        throw new Error('Mock Error')
      })
    consoleSpy = vi.spyOn(console, 'log')
    fetchMock = vi.spyOn(global, 'fetch')
    gitFetcherBitBucketTags = new GitFetcherBitbucketTagsAndBranches(
      gitServerConfigDefault,
      configDefault,
      'tags'
    )
  })

  it('should return empty array when no tags were returned by BitBucket', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toMatch(fetchUrlMatcher)
      return {
        status: 200,
        json: async () => bitBucketTagEmptyResponse,
      }
    })

    const result: BitbucketTag[] =
      (await gitFetcherBitBucketTags.fetchResource()) as BitbucketTag[]
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(consoleSpy).toHaveBeenCalledWith('Fetched 0 tags')
    expect(result).toHaveLength(0)

    expect(responseStatusHandlerSpy).toBeCalledTimes(0)
  })

  it('should send exactly one request, if the first response contains all tags', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toMatch(fetchUrlMatcher)
      return {
        status: 200,
        json: async () => bitBucketTagSinglePageResponse,
      }
    })

    const result: BitbucketTag[] =
      (await gitFetcherBitBucketTags.fetchResource()) as BitbucketTag[]
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(consoleSpy).toBeCalledWith('Fetched 1 tag')
    expect(result).toHaveLength(1)
    expect(result).toEqual(bitBucketTagSinglePageResponse.values)

    expect(responseStatusHandlerSpy).toBeCalledTimes(0)
  })

  it('should send multiple requests, until all tags have been fetched', async () => {
    let queriedFirstPage = false
    let queriedSecondPage = false
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toMatch(fetchUrlMatcher)
      let responseBodyToReturn: BitbucketResponse<BitbucketTag>
      if (url.endsWith('start=0')) {
        responseBodyToReturn = bitBucketTagMultiPageResponse[0]
        queriedFirstPage = true
      } else if (url.endsWith('start=1')) {
        responseBodyToReturn = bitBucketTagMultiPageResponse[1]
        queriedSecondPage = true
      } else {
        fail(`unexpected url: ${url}`)
      }
      return {
        status: 200,
        json: async () => responseBodyToReturn,
      }
    })

    const result: BitbucketTag[] =
      (await gitFetcherBitBucketTags.fetchResource()) as BitbucketTag[]
    expect(fetchMock).toBeCalledTimes(2)
    expect(consoleSpy).toBeCalledWith('Fetched 2 tags')
    expect(queriedFirstPage).toBe(true)
    expect(queriedSecondPage).toBe(true)
    expect(result).toHaveLength(2)
    expect(result).toEqual([
      ...bitBucketTagMultiPageResponse[0].values,
      ...bitBucketTagMultiPageResponse[1].values,
    ])

    expect(responseStatusHandlerSpy).toBeCalledTimes(0)
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
        await gitFetcherBitBucketTags.fetchResource()
      } catch (e) {
        errorWasThrown = true
      }
      expect(errorWasThrown).toBe(true)
      expect(responseStatusHandlerSpy).toHaveBeenCalledOnce()
      expect(responseStatusHandlerSpy).toHaveBeenCalledWith(responseCode)
    }
  )
})
