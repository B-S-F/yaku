import { beforeEach, describe, expect, it } from 'vitest'
import { GitFetcher, GitResource } from '../../src/fetchers'
import { GitFetcherBitbucketTagsAndBranches } from '../../src/fetchers/git-fetcher-bitbucket-tags-and-branches'
import { GitFetcherBitbucketPrs } from '../../src/fetchers/git-fetcher-bitbucket-prs'
import { GitFetcherGithubPrs } from '../../src/fetchers/git-fetcher-github-prs'
import {
  ConfigFileData,
  GitConfigResource,
  gitFetcherPullRequests,
} from '../../src/model/config-file-data'
import {
  GitServerConfig,
  SupportedGitServerType,
} from '../../src/model/git-server-config'
import generateGitFetcher from '../../src/fetchers/generate-git-fetcher'

describe('Git Fetcher Factory', () => {
  let gitServerConfig: GitServerConfig
  let configFileData: ConfigFileData

  beforeEach(() => {
    gitServerConfig = {
      gitServerType: 'bitbucket',
      gitServerApiUrl: 'https://www.foo.bar',
      gitServerAuthMethod: 'token',
      gitServerApiToken: 'someToken',
      gitFetcherConfigFilePath: './config.yaml',
      gitFetcherOutputFilePath: './output.json',
    }
    configFileData = {
      data: {
        org: 'someOrg',
        repo: 'someRepo',
        resource: 'prs',
      },
    }
  })

  it('should return fetcher for Bitbucket branches', () => {
    expectFetcherType(
      'bitbucket',
      'branches',
      GitFetcherBitbucketTagsAndBranches.name
    )
  })

  it('should return fetcher for Bitbucket tags', () => {
    expectFetcherType(
      'bitbucket',
      'tags',
      GitFetcherBitbucketTagsAndBranches.name
    )
  })

  it.each(gitFetcherPullRequests)(
    'should return fetcher for Bitbucket PRs, when passing %s as resource',
    (resource) => {
      expectFetcherType('bitbucket', resource, GitFetcherBitbucketPrs.name)
    }
  )

  it.each(gitFetcherPullRequests)(
    'should return fetcher for Github PRs, when passing %s as resource',
    (resource) => {
      expectFetcherType('github', resource, GitFetcherGithubPrs.name)
    }
  )

  it('should throw exception when passing an unknown git server type', () => {
    gitServerConfig.gitServerType = 'ado' as 'bitbucket' // explicit type cast for error case
    let errorWasThrownAsExpected = false

    try {
      generateGitFetcher(gitServerConfig, configFileData)
    } catch (e) {
      console.log(e)
      expect(e.toString()).toContain(
        'Unsupported git server / git resource combination: ado/prs'
      )
      errorWasThrownAsExpected = true
    }

    expect(errorWasThrownAsExpected).toBe(true)
  })

  it('should throw exception when passing an unknown resource', () => {
    configFileData.data.resource = 'unknownResource' as 'prs' // explicit type cast for error case
    let errorWasThrownAsExpected = false

    try {
      const result = generateGitFetcher(gitServerConfig, configFileData)
      console.log(result)
    } catch (e) {
      console.log(e)
      errorWasThrownAsExpected = true
    }

    expect(errorWasThrownAsExpected).toBe(true)
  })

  function expectFetcherType(
    gitServerType: SupportedGitServerType,
    gitConfigResource: GitConfigResource,
    expectedFetcherName: string
  ): void {
    gitServerConfig.gitServerType = gitServerType
    configFileData.data.resource = gitConfigResource
    const result: GitFetcher<GitResource> = generateGitFetcher(
      gitServerConfig,
      configFileData
    )
    expect(result.constructor.name).toEqual(expectedFetcherName)
  }
})
