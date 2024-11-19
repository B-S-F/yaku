import { beforeEach, describe, expect, it, SpyInstance, vi } from 'vitest'
import {
  multiPageResponse,
  singlePageResponse,
} from './fixtures/bitbucket-responses-prs'
import { GitFetcherBitbucketPrs } from '../../src/fetchers/git-fetcher-bitbucket-prs'
import * as responseHandler from '../../src/utils/handle-response-status'
import { BitbucketResponse } from '../../src/model/bitbucket-response'
import { GitServerConfig } from '../../src/model/git-server-config'
import { BitbucketPr } from '../../src/model/bitbucket-pr'
import {
  allowedFilterState,
  AllowedFilterStateType,
  ConfigFileData,
} from '../../src/model/config-file-data'

const gitServerConfigDefault: GitServerConfig = {
  gitServerType: 'bitbucket',
  gitServerApiUrl: 'www.foo.bar',
  gitServerAuthMethod: 'basic',
} as GitServerConfig

let consoleSpy: SpyInstance | undefined = undefined
let fetchMock: SpyInstance | undefined = undefined
let gitFetcherBitbucketPrs: GitFetcherBitbucketPrs | undefined = undefined
let handleResponseStatusSpy: SpyInstance | undefined = undefined

describe('GitFetcherBitBucket', () => {
  let configDefault: ConfigFileData

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log')
    fetchMock = vi.spyOn(global, 'fetch')
    handleResponseStatusSpy = vi
      .spyOn(responseHandler, 'handleResponseStatus')
      .mockImplementation(() => {
        throw new Error('Mock Error')
      })
    configDefault = {
      data: {
        org: 'foo_org',
        repo: 'foo_repo',
        resource: 'prs',
      },
    }

    gitFetcherBitbucketPrs = new GitFetcherBitbucketPrs(
      gitServerConfigDefault,
      configDefault,
    )
  })

  it('should throw an error message, when fetch-method is unable to get response', async () => {
    await expect(gitFetcherBitbucketPrs.fetchResource()).rejects.toThrow(
      'Failed to parse URL from www.foo.bar/projects/foo_org/repos/foo_repo/pull-requests?state=ALL&start=0',
    )
  })

  it(`should call the fetch method only once and return array with prs, when it return body's attribute "isLastPage" is true`, async () => {
    const responseFixture: BitbucketResponse<Partial<BitbucketPr>> =
      singlePageResponse

    fetchMock.mockImplementation(async () => {
      return {
        status: 200,
        json: async () => {
          return responseFixture
        },
      } as Response
    })

    const result = await gitFetcherBitbucketPrs.fetchResource()

    expect(fetchMock).toBeCalledTimes(1)
    const expectedNumberOfPrs = responseFixture.values.length
    expect(consoleSpy).toHaveBeenCalledWith(
      `Fetched ${responseFixture.values.length} pull request${
        expectedNumberOfPrs === 1 ? '' : 's'
      }`,
    )
    expect(result).toEqual(responseFixture.values)
  })

  it(`should call the fetch method twice and return an array that with prs from both calls, first response body's attribute 'isLastPage' is false but second is true`, async () => {
    const responseFixture: BitbucketResponse<BitbucketPr>[] = multiPageResponse

    const expectedResultArray: BitbucketPr[] = responseFixture.flatMap(
      (response) => response.values,
    )

    fetchMock.mockImplementation(async (url: string) => {
      return {
        status: 200,
        json: async () => {
          const page = url.split('=').slice(-1)[0]
          return responseFixture[
            Number(page) === 0 ? Number(page) : Number(page) - 1
          ]
        },
      } as Response
    })

    const result = await gitFetcherBitbucketPrs.fetchResource()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const expectedLength = expectedResultArray.length
    expect(consoleSpy).toHaveBeenCalledWith(
      `Fetched ${expectedLength} pull request${expectedLength === 1 ? '' : 's'}`,
    )
    expect(result).toEqual(expectedResultArray)
  })

  it(`should throw an error, when the response status is not 200.`, async () => {
    const responseFixture: BitbucketResponse<Partial<BitbucketPr>>[] =
      multiPageResponse

    fetchMock.mockImplementation(async (url: string) => {
      return {
        status: 404,
        json: async () => {
          const page = url.split('=').slice(-1)[0]
          return responseFixture[
            Number(page) === 0 ? Number(page) : Number(page) - 1
          ]
        },
      } as Response
    })

    let errorCaught = false
    try {
      await gitFetcherBitbucketPrs.fetchResource()
    } catch (error) {
      errorCaught = true
      expect(error.message).toEqual('Mock Error')
    }

    expect(errorCaught).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(handleResponseStatusSpy).toHaveBeenCalledTimes(1)
  })

  it('should set state filter to "ALL" in the URL if no state is given in the configuration', async () => {
    const config: ConfigFileData = configDefault
    config.data.filter = undefined

    gitFetcherBitbucketPrs = new GitFetcherBitbucketPrs(
      gitServerConfigDefault,
      config,
    )
    const responseFixture: BitbucketResponse<Partial<BitbucketPr>> =
      singlePageResponse
    fetchMock.mockImplementation(async () => {
      return {
        status: 200,
        json: async () => {
          return responseFixture
        },
      } as Response
    })

    // eslint-disable-next-line
    // @ts-ignore
    const composeUrlSpy = vi.spyOn(gitFetcherBitbucketPrs, 'composePrUrl')

    await gitFetcherBitbucketPrs.fetchResource()

    expect(composeUrlSpy).toBeCalledTimes(1)
    expect(composeUrlSpy).toBeCalledWith(undefined, 0)
    expect(composeUrlSpy).toReturnWith(
      'www.foo.bar/projects/foo_org/repos/foo_repo/pull-requests?state=ALL&start=0',
    )
  })

  it.each(allowedFilterState)(
    'should set the state filter to %s in the URL',
    async (state: AllowedFilterStateType) => {
      const config: ConfigFileData = {
        data: { ...configDefault.data, filter: {} },
      }
      config.data.filter.state = state

      gitFetcherBitbucketPrs = new GitFetcherBitbucketPrs(
        gitServerConfigDefault,
        config,
      )
      const responseFixture: BitbucketResponse<Partial<BitbucketPr>> =
        singlePageResponse
      fetchMock.mockImplementation(async () => {
        return {
          status: 200,
          json: async () => {
            return responseFixture
          },
        } as Response
      })

      // eslint-disable-next-line
      // @ts-ignore
      const composeUrlSpy = vi.spyOn(gitFetcherBitbucketPrs, 'composePrUrl')
      await gitFetcherBitbucketPrs.fetchResource()

      expect(composeUrlSpy).toBeCalledTimes(1)
      expect(composeUrlSpy).toBeCalledWith(state, 0)
      expect(composeUrlSpy).toReturnWith(
        `www.foo.bar/projects/foo_org/repos/foo_repo/pull-requests?state=${state}&start=0`,
      )
    },
  )
})
