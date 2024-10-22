import { AppOutput } from '@B-S-F/autopilot-utils'
import { accessSync, existsSync } from 'fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as generateGitFetcher from '../../src/fetchers/generate-git-fetcher'
import { GitFetcherBitbucketPrs } from '../../src/fetchers/git-fetcher-bitbucket-prs'
import { GitFetcherGithubPrs } from '../../src/fetchers/git-fetcher-github-prs'
import { BitbucketPr } from '../../src/model/bitbucket-pr'
import { GitFetcherConfig } from '../../src/model/config-file-data'
import { GitServerConfig } from '../../src/model/git-server-config'
import { GithubLabel } from '../../src/model/github-label'
import * as run from '../../src/run'
import * as compareLabels from '../../src/utils/compare-labels'
import * as validation from '../../src/utils/validation'

vi.mock('fs')
vi.mock('../src/utils/validation')
vi.mock('../../src/fetchers/git-fetcher-bitbucket-prs')
vi.mock('../../src/fetchers/git-fetcher-github-prs')

describe('Run', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Validate Environment Variables', () => {
    let output: AppOutput
    beforeEach(() => {
      vi.mocked(accessSync).mockReturnValue(undefined)
      vi.mocked(existsSync).mockReturnValue(true)

      vi.stubEnv('evidence_path', 'foo/bar')
      output = new AppOutput()
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('throws an error with corresponding error message, if expected environments are not satisfied.', async () => {
      vi.stubEnv('NODE_TLS_REJECT_UNAUTHORIZED', '0')
      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', '')
      vi.stubEnv('GIT_FETCHER_SERVER_API_URL', '')
      vi.stubEnv('GIT_FETCHER_API_TOKEN', '')
      await expect(run.run(output)).rejects.toThrowError()
    })

    it('throws an error with corresponding error message, when env_var GIT_FETCHER_SERVER_TYPE is undefined', async () => {
      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', '')
      await expect(run.run(output)).rejects.toThrowError(
        'GIT_FETCHER_SERVER_TYPE environment variable is not set'
      )
    })

    it('throws an error with corresponding error message, when env_var GIT_FETCHER_SERVER_TYPE is not a supported git Server Type', async () => {
      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', 'foo')

      await expect(run.run(output)).rejects.toThrowError(
        'The server type "foo" is not supported'
      )
    })

    it('throws an error with corresponding error message, when env_var GIT_FETCHER_SERVER_API_URL is not set', async () => {
      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', 'bitbucket')
      vi.stubEnv('GIT_FETCHER_SERVER_API_URL', '')

      await expect(run.run(output)).rejects.toThrowError(
        'GIT_FETCHER_SERVER_API_URL environment variable is not set.'
      )
    })

    it('throws an error with corresponding error message, when env_var GIT_FETCHER_SERVER_API_URL is no https url', async () => {
      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', 'bitbucket')
      vi.stubEnv('GIT_FETCHER_SERVER_API_URL', 'http://www.foo.bar')

      await expect(run.run(output)).rejects.toThrowError(
        'GIT_FETCHER_SERVER_API_URL environment variable must use secured connections with https'
      )
    })

    it('throws an error with corresponding error message, when env_var GIT_FETCHER_SERVER_AUTH_METHOD is undefined', async () => {
      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', 'bitbucket')
      vi.stubEnv('GIT_FETCHER_SERVER_API_URL', 'https://www.foo.bar')
      vi.stubEnv('GIT_FETCHER_API_TOKEN', '')

      await expect(run.run(output)).rejects.toThrowError(
        'GIT_FETCHER_API_TOKEN environment variable is required for "token" authentication, but is not set or empty.'
      )
    })

    it('throws an error with corresponding error message, when env_var GIT_FETCHER_SERVER_AUTH_METHOD is no valid auth method', async () => {
      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', 'bitbucket')
      vi.stubEnv('GIT_FETCHER_SERVER_API_URL', 'https://www.foo.bar')
      vi.stubEnv('GIT_FETCHER_SERVER_AUTH_METHOD', 'fooBar')

      await expect(run.run(output)).rejects.toThrowError(
        'No valid authentication method provided. Valid authentication methods are: token,basic'
      )
    })

    it('throws an error with corresponding error message, when auth method is basic an no password is set', async () => {
      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', 'bitbucket')
      vi.stubEnv('GIT_FETCHER_SERVER_API_URL', 'https://www.foo.bar')
      vi.stubEnv('GIT_FETCHER_SERVER_AUTH_METHOD', 'basic')
      vi.stubEnv('GIT_FETCHER_USERNAME', 'foo')

      await expect(run.run(output)).rejects.toThrowError(
        'GIT_FETCHER_PASSWORD environment variable is required for "basic" authentication, but is not set or empty.'
      )
    })

    it('throws an error with corresponding error message, when auth method is basic an no username is set', async () => {
      vi.stubEnv('evidence_path', 'foo/bar')
      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', 'bitbucket')
      vi.stubEnv('GIT_FETCHER_SERVER_API_URL', 'https://www.foo.bar')
      vi.stubEnv('GIT_FETCHER_SERVER_AUTH_METHOD', 'basic')
      vi.stubEnv('GIT_FETCHER_PASSWORD', 'foo')

      await expect(run.run(output)).rejects.toThrowError(
        'GIT_FETCHER_USERNAME environment variable is required for "basic" authentication, but is not set or empty.'
      )
    })
  })

  describe('Run', () => {
    let gitServerConfig: GitServerConfig
    beforeEach(async () => {
      vi.mocked(accessSync).mockReturnValue(undefined)
      vi.mocked(existsSync).mockReturnValue(true)

      vi.stubEnv('evidence_path', 'foo/bar')
      vi.stubEnv('GIT_FETCHER_SERVER_API_URL', 'https://www.foo.bar')
      vi.stubEnv('GIT_FETCHER_SERVER_AUTH_METHOD', 'basic')
      vi.stubEnv('GIT_FETCHER_USERNAME', 'foo')
      vi.stubEnv('GIT_FETCHER_PASSWORD', 'bar')

      gitServerConfig = {
        gitServerType: 'bitbucket',
        gitServerApiUrl: 'https://www.foo.bar',
        gitFetcherConfigFilePath: './gitfetcher-config.yaml',
        gitFetcherOutputFilePath: './output.json',
        gitServerAuthMethod: 'token',
        gitServerApiToken: 'someToken',
      }
    })

    it('prompts 1 message to the console and compareLabels method was not called, when everything is set properly and bitbucket is set as server type.', async () => {
      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', 'bitbucket')
      const logSpy = vi.spyOn(global.console, 'log')
      const compareLabelsSpy = vi.spyOn(compareLabels, 'compareLabels')
      const generateGitFetcherSpy = vi.spyOn(generateGitFetcher, 'default')
      const gitFetcherConfig: GitFetcherConfig = {
        org: 'fooOrg',
        repo: 'barRepo',
        resource: 'prs',
        labels: ['foo'],
      }
      generateGitFetcherSpy.mockReturnValue(
        new GitFetcherBitbucketPrs(gitServerConfig, { data: gitFetcherConfig })
      )

      const gitFetcherConfigPromise: Promise<GitFetcherConfig> = new Promise(
        (resolve) => resolve(gitFetcherConfig)
      )
      vi.spyOn(validation, 'validateFetcherConfig').mockReturnValue(
        gitFetcherConfigPromise
      )

      Object.defineProperty(GitFetcherBitbucketPrs.prototype, 'fetchUrl', {
        value: 'www.foo.bar',
      })

      vi.mocked(
        GitFetcherBitbucketPrs.prototype.fetchResource
      ).mockImplementation(async () => {
        return [
          {
            id: 1,
            state: 'OPEN',
            updatedDate: 123456,
          },
        ] as BitbucketPr[]
      })

      await run.run(new AppOutput())

      expect(logSpy).toBeCalledTimes(1)
      expect(logSpy).toBeCalledWith(
        'Fetch from https://www.foo.bar was successful with config {"org":"fooOrg","repo":"barRepo","resource":"prs","labels":["foo"]}'
      )
      expect(compareLabelsSpy).not.toHaveBeenCalled()
    })

    it('prompts 1 message to the console and compareLabels method has not been called, when everything is set properly, gitFetcher config does not include labels and github is set as server type', async () => {
      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', 'github')
      const logSpy = vi.spyOn(global.console, 'log')
      const compareLabelsSpy = vi.spyOn(compareLabels, 'compareLabels')
      const generateGitFetcherSpy = vi.spyOn(generateGitFetcher, 'default')
      gitServerConfig.gitServerType = 'github'
      const gitFetcherConfig: GitFetcherConfig = {
        org: 'foo org',
        repo: 'bar repo',
        resource: 'pr',
      }
      generateGitFetcherSpy.mockReturnValue(
        new GitFetcherGithubPrs(gitServerConfig, { data: gitFetcherConfig })
      )

      const gitFetcherConfigPromise: Promise<GitFetcherConfig> = new Promise(
        (resolve) => resolve(gitFetcherConfig)
      )
      vi.spyOn(validation, 'validateFetcherConfig').mockReturnValue(
        gitFetcherConfigPromise
      )

      Object.defineProperty(GitFetcherGithubPrs.prototype, 'fetchUrl', {
        value: 'www.foo.bar',
      })

      vi.mocked(GitFetcherGithubPrs.prototype.fetchResource).mockImplementation(
        async () => {
          const labels: GithubLabel = {
            id: 1,
            name: 'wontfix',
          }

          return [
            {
              number: 1,
              state: 'open',
              labels: [labels],
            },
          ]
        }
      )

      await run.run(new AppOutput())

      expect(logSpy).toBeCalledTimes(1)
      expect(logSpy).toBeCalledWith(
        'Fetch from https://www.foo.bar was successful with config {"org":"foo org","repo":"bar repo","resource":"pr"}'
      )
      expect(compareLabelsSpy).not.toHaveBeenCalled()
    })

    it('should throw error, when generateGitFetcher throws error', async () => {
      const generateGitFetcherSpy = vi.spyOn(generateGitFetcher, 'default')
      generateGitFetcherSpy.mockImplementation(() => {
        throw new Error('mock error')
      })

      vi.stubEnv('GIT_FETCHER_SERVER_TYPE', 'github')
      const gitFetcherConfig: GitFetcherConfig = {
        org: 'foo org',
        repo: 'bar repo',
        resource: 'pr',
      }
      const gitFetcherConfigPromise: Promise<GitFetcherConfig> = new Promise(
        (resolve) => resolve(gitFetcherConfig)
      )
      vi.spyOn(validation, 'validateFetcherConfig').mockReturnValue(
        gitFetcherConfigPromise
      )
      expect(run.run(new AppOutput())).rejects.toThrowError('mock error')
    })
  })
})
