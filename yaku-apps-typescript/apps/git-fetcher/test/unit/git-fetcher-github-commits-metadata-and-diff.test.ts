import { beforeEach, describe, expect, it, SpyInstance, vi } from 'vitest'
import { CommitsMetadataAndDiff } from '../../src/model/commits-metadata-and-diff.js'
import { ConfigFileData } from '../../src/model/config-file-data.js'
import { GitServerConfig } from '../../src/model/git-server-config.js'
import * as responseHandler from '../../src/utils/handle-response-status.js'
import {
  githubStartCommitResponse,
  githubEndCommitResponse,
  githubDiffResponse,
  githubMultipleCommitsResponse,
  githubMultipleCommitsResponsePage1,
  githubMultipleCommitsResponsePage2,
  githubMultipleCommitsResponsePage3,
  githubCommitsEmptyResponse,
  githubNoDiffResponse,
} from './fixtures/github-responses-commits-and-diff.js'
import { GitFetcherGithubCommitsAndDiff } from '../../src/fetchers/git-fetcher-github-commits-and-diff.js'

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
      startHash: 'afeaebf412c6d0b865a36cfdec37fdb46c0fab63',
      endHash: '8036cf75f4b7365efea76cbd716ef12d352d7d29',
    },
    filePath: 'apps/git-fetcher/src/fetchers/git-fetcher.ts',
  },
} as const

let responseStatusHandlerSpy: SpyInstance
let consoleSpy: SpyInstance
let fetchMock: SpyInstance
let gitFetcherGithubCommitsAndDiff: GitFetcherGithubCommitsAndDiff

const fetchAllCommitsUrlMatcher = /\/commits\?path=/
const fetchIndividualCommitUrlMatcher = /\/commits\//
const fetchDiffUrlMatcher = /\/compare\//
const fetchCommitsOrDiffUrlMatcher = /\/commits\?path=|\/commits\/|\/compare\//
const startCommitIdMatcher = /afeaebf412c6d0b865a36cfdec37fdb46c0fab63/

describe('Git Fetcher Metadata And Diff', () => {
  beforeEach(() => {
    responseStatusHandlerSpy = vi
      .spyOn(responseHandler, 'handleResponseStatus')
      .mockImplementation(() => {
        throw new Error('Mock Error')
      })
    consoleSpy = vi.spyOn(console, 'log')
    fetchMock = vi.spyOn(global, 'fetch')
    gitFetcherGithubCommitsAndDiff = new GitFetcherGithubCommitsAndDiff(
      gitServerConfigDefault,
      configDefault,
    )
  })

  it('should return empty array when no commits were returned by Github', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toMatch(fetchCommitsOrDiffUrlMatcher)
      if (url.match(fetchIndividualCommitUrlMatcher)) {
        return {
          status: 200,
          json: async () => githubStartCommitResponse,
        }
      }
      if (url.match(fetchAllCommitsUrlMatcher)) {
        return {
          status: 200,
          json: async () => githubCommitsEmptyResponse,
        }
      }
      if (url.match(fetchDiffUrlMatcher)) {
        return {
          status: 200,
          json: async () => githubNoDiffResponse,
        }
      }
    })

    const result: CommitsMetadataAndDiff =
      (await gitFetcherGithubCommitsAndDiff.fetchResource()) as CommitsMetadataAndDiff
    expect(fetchMock).toBeCalledTimes(4)
    expect(consoleSpy).toHaveBeenCalledWith(
      'Fetched metadata about starting commit at 2023-03-06T14:11:29Z',
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      'Fetched metadata about ending commit at 2023-03-06T14:11:29Z',
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      'Fetched 0 lines added and 0 lines removed',
    )
    expect(consoleSpy).toHaveBeenCalledWith('Fetched metadata about 0 commits')
    expect(result.commitsMetadata).toHaveLength(0)
    expect(result.diff.linesAdded).toHaveLength(0)
    expect(result.diff.linesRemoved).toHaveLength(0)

    expect(responseStatusHandlerSpy).toBeCalledTimes(0)
  })

  it('should send two request for commits and one request for diff, if the first commits response contains all commits', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toMatch(fetchCommitsOrDiffUrlMatcher)
      if (url.match(fetchIndividualCommitUrlMatcher)) {
        if (url.match(startCommitIdMatcher)) {
          return {
            status: 200,
            json: async () => githubStartCommitResponse,
          }
        } else {
          return {
            status: 200,
            json: async () => githubEndCommitResponse,
          }
        }
      }
      if (url.match(fetchAllCommitsUrlMatcher)) {
        if (url.match(/&page=1/)) {
          return {
            status: 200,
            json: async () => githubMultipleCommitsResponse,
          }
        } else {
          return {
            status: 200,
            json: async () => githubCommitsEmptyResponse,
          }
        }
      }
      if (url.match(fetchDiffUrlMatcher)) {
        return {
          status: 200,
          json: async () => githubDiffResponse,
        }
      }
    })

    const result: CommitsMetadataAndDiff =
      (await gitFetcherGithubCommitsAndDiff.fetchResource()) as CommitsMetadataAndDiff
    expect(fetchMock).toBeCalledTimes(5)
    expect(consoleSpy).toHaveBeenCalledWith(
      'Fetched metadata about starting commit at 2023-03-06T14:11:29Z',
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      'Fetched metadata about ending commit at 2023-07-12T10:46:50Z',
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      'Fetched 2 lines added and 98 lines removed',
    )
    expect(consoleSpy).toHaveBeenCalledWith('Fetched metadata about 5 commits')
    expect(result.commitsMetadata).toHaveLength(5)
    expect(result.diff.linesAdded).toHaveLength(2)
    expect(result.diff.linesRemoved).toHaveLength(98)

    expect(responseStatusHandlerSpy).toBeCalledTimes(0)
  })

  it('should send multiple requests, until all commits have been fetched', async () => {
    let queriedFirstPage = false
    let queriedSecondPage = false
    let queriedThirdPage = false
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toMatch(fetchCommitsOrDiffUrlMatcher)
      if (url.match(fetchIndividualCommitUrlMatcher)) {
        if (url.match(startCommitIdMatcher)) {
          return {
            status: 200,
            json: async () => githubStartCommitResponse,
          }
        } else {
          return {
            status: 200,
            json: async () => githubEndCommitResponse,
          }
        }
      }
      if (url.match(fetchAllCommitsUrlMatcher)) {
        if (url.match(/&page=1/)) {
          queriedFirstPage = true
          return {
            status: 200,
            json: async () => githubMultipleCommitsResponsePage1,
          }
        }
        if (url.match(/&page=2/)) {
          queriedSecondPage = true
          return {
            status: 200,
            json: async () => githubMultipleCommitsResponsePage2,
          }
        }
        if (url.match(/&page=3/)) {
          queriedThirdPage = true
          return {
            status: 200,
            json: async () => githubMultipleCommitsResponsePage3,
          }
        } else {
          return {
            status: 200,
            json: async () => githubCommitsEmptyResponse,
          }
        }
      }
      if (url.match(fetchDiffUrlMatcher)) {
        return {
          status: 200,
          json: async () => githubDiffResponse,
        }
      }
    })

    const result: CommitsMetadataAndDiff =
      (await gitFetcherGithubCommitsAndDiff.fetchResource()) as CommitsMetadataAndDiff

    expect(fetchMock).toBeCalledTimes(7)
    expect(consoleSpy).toHaveBeenCalledWith(
      'Fetched metadata about starting commit at 2023-03-06T14:11:29Z',
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      'Fetched metadata about ending commit at 2023-07-12T10:46:50Z',
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      'Fetched 2 lines added and 98 lines removed',
    )
    expect(consoleSpy).toHaveBeenCalledWith('Fetched metadata about 5 commits')
    expect(queriedFirstPage).toBe(true)
    expect(queriedSecondPage).toBe(true)
    expect(queriedThirdPage).toBe(true)
    expect(result.commitsMetadata).toHaveLength(5)
    expect(result.diff.linesAdded).toHaveLength(2)
    expect(result.diff.linesRemoved).toHaveLength(98)
    expect(result.commitsMetadata).toEqual([
      githubMultipleCommitsResponsePage1[0].commit,
      githubMultipleCommitsResponsePage1[1].commit,
      githubMultipleCommitsResponsePage2[0].commit,
      githubMultipleCommitsResponsePage2[1].commit,
      githubMultipleCommitsResponsePage3[0].commit,
    ])

    expect(responseStatusHandlerSpy).toBeCalledTimes(0)
  })

  it.each([400, 401, 403, 500])(
    'should throw error when Github responds with non-200 code (%d)',
    async (responseCode: number) => {
      fetchMock.mockImplementation(async (url: string) => {
        expect(url).toMatch(fetchCommitsOrDiffUrlMatcher)
        return {
          status: responseCode,
        }
      })

      let errorWasThrown = false
      try {
        await gitFetcherGithubCommitsAndDiff.fetchResource()
      } catch (e) {
        errorWasThrown = true
      }
      expect(errorWasThrown).toBe(true)
      expect(responseStatusHandlerSpy).toHaveBeenCalledOnce()
      expect(responseStatusHandlerSpy).toHaveBeenCalledWith(responseCode)
    },
  )
})
