// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { beforeEach, describe, expect, it, SpyInstance, vi } from 'vitest'
import { GitFetcherGithubPrs } from '../../src/fetchers/git-fetcher-github-prs'
import * as responseHandler from '../../src/utils/handle-response-status'
import * as compareLabels from '../../src/utils/compare-labels'
import { GitServerConfig } from '../../src/model/git-server-config'
import { ConfigFileData } from '../../src/model/config-file-data'
import { multiPageResponse } from './fixtures/github-responses-prs'
import { GithubPr } from '../../src/model/github-pr'

const gitServerConfigDefault: GitServerConfig = {
  gitServerType: 'bitbucket',
  gitServerApiUrl: 'www.foo.bar',
  gitServerAuthMethod: 'basic',
} as GitServerConfig

const configDefault: ConfigFileData = {
  data: {
    org: 'foo_org',
    repo: 'foo_repo',
    resource: 'prs',
    labels: ['foo'],
  },
}

let gitFetcherGithub: GitFetcherGithubPrs | undefined = undefined
let consoleSpy: SpyInstance | undefined = undefined
let fetchMock: SpyInstance | undefined = undefined
let handleResponseStatusSpy: SpyInstance | undefined = undefined
let compareLabelMock: SpyInstance | undefined = undefined

describe('GitFetcherGitHub', () => {
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log')
    fetchMock = vi.spyOn(global, 'fetch')
    compareLabelMock = vi.spyOn(compareLabels, 'compareLabels')
    handleResponseStatusSpy = vi
      .spyOn(responseHandler, 'handleResponseStatus')
      .mockImplementation(() => {
        throw new Error('Mock Error')
      })

    gitFetcherGithub = new GitFetcherGithubPrs(
      gitServerConfigDefault,
      configDefault
    )
  })

  it('should throw an error message, when fetch-method is unable to get response.', async () => {
    await expect(gitFetcherGithub.fetchResource()).rejects.toThrow(
      'Failed to parse URL from www.foo.bar/repos/foo_org/foo_repo/pulls?state=all&per_page=100&page=1'
    )
  })

  it('should create a correct url to fetch the prs, based on the information given in the config files.', async () => {
    const config: ConfigFileData = {
      data: { ...configDefault.data },
    }

    gitFetcherGithub = new GitFetcherGithubPrs(gitServerConfigDefault, config)
    fetchMock.mockImplementation(async () => {
      return {
        status: 200,
        json: async () => {
          return {}
        },
      } as Response
    })

    // eslint-disable-next-line
    // @ts-ignore
    const composeUrlSpy = vi.spyOn(gitFetcherGithub, 'composeUrl')
    await gitFetcherGithub.fetchResource()

    expect(composeUrlSpy).toBeCalledTimes(1)
    expect(composeUrlSpy).toBeCalledWith(1)
    expect(composeUrlSpy).toReturnWith(
      `www.foo.bar/repos/foo_org/foo_repo/pulls?state=all&per_page=100&page=1`
    )
  })

  it(`should call the fetch method three times and return array with prs, when the response body of the last call, returns an empty array.`, async () => {
    const responseFixture: GithubPr[][] = multiPageResponse
    const expectedResultArray: GithubPr[] = responseFixture.flat()

    fetchMock.mockImplementation(async (url: string) => {
      return {
        status: 200,
        json: async () => {
          const page = url.split('=').slice(-1)[0]
          return responseFixture[Number(page) - 1]
        },
      } as Response
    })

    const result = await gitFetcherGithub.fetchResource()

    expect(fetchMock).toBeCalledTimes(3)
    expect(compareLabelMock).toBeCalledTimes(4)
    const expectedLength = expectedResultArray.length
    expect(consoleSpy).toHaveBeenCalledWith(
      `Fetched ${expectedLength} pull request${expectedLength === 1 ? '' : 's'}`
    )
    expect(result).toEqual(expectedResultArray)
  })

  it(`should throw an error, when response status is not 200`, async () => {
    const responseFixture: GithubPr[][] = multiPageResponse
    let errorThrown = false

    fetchMock.mockImplementation(async (url: string) => {
      return {
        status: 400,
        json: async () => {
          const page = url.split('=').slice(-1)[0]
          return responseFixture[Number(page) - 1]
        },
      } as Response
    })

    try {
      await gitFetcherGithub.fetchResource()
    } catch (error) {
      errorThrown = true
      expect(error.message).toEqual('Mock Error')
    }

    expect(errorThrown).toBeTruthy()
    expect(handleResponseStatusSpy).toHaveBeenCalledTimes(1)
    expect(fetchMock).toBeCalledTimes(1)
  })
})
