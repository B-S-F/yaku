import * as fs from 'fs'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  MockServer,
  MockServerOptions,
  run,
  RunProcessResult,
} from '../../../../integration-tests/src/util'
import { getGitPullRequestsMockOptions } from './fixtures/getGitPullRequestsMockServerResponse'
import {
  SupportedAuthMethod,
  supportedAuthMethods,
} from '../../src/model/git-server-config'
import {
  defaultEnvironment,
  gitFetcherExecutable,
  MOCK_SERVER_PORT,
  verifyErrorCase,
  verifyOutputFile,
  verifyPrRequest,
} from './utils'

describe('Authentication', () => {
  let mockServer: MockServer | undefined

  const requestUrlPullRequests =
    '/projects/aquatest/repos/bitbucket-fetcher-test-repo/pull-requests'

  beforeAll(() => {
    expect(fs.existsSync(gitFetcherExecutable)).toBe(true)
  })

  beforeEach(() => {
    fs.mkdirSync(`${defaultEnvironment.evidence_path}`)
  })

  afterEach(async () => {
    fs.rmSync(`${defaultEnvironment.evidence_path}`, {
      recursive: true,
    })
    await mockServer?.stop()
  })

  describe('Success Cases', () => {
    describe('Authentication', () => {
      const options: MockServerOptions = getGitPullRequestsMockOptions(
        MOCK_SERVER_PORT,
        200
      )

      beforeEach(() => {
        mockServer = new MockServer(options)
      })

      it.each(supportedAuthMethods)(
        `should fetch file from bitbucket and save it for auth method "%s"`,
        async (authMethod: SupportedAuthMethod) => {
          const env = {
            ...defaultEnvironment,
            GIT_FETCHER_SERVER_AUTH_METHOD: authMethod,
            GIT_FETCHER_SERVER_TYPE: 'bitbucket',
            GIT_FETCHER_API_TOKEN:
              authMethod === 'token' ? 'someToken' : undefined,
            GIT_FETCHER_USERNAME: authMethod === 'basic' ? 'john' : undefined,
            GIT_FETCHER_PASSWORD: authMethod === 'basic' ? 'secret' : undefined,
            GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-bitbucket.yml`,
          }

          const result: RunProcessResult = await run(
            gitFetcherExecutable,
            undefined,
            {
              env: env,
            }
          )
          expect(mockServer!.getNumberOfRequests()).toEqual(1)
          verifyPrRequest(mockServer!, requestUrlPullRequests, authMethod)

          await verifyOutputFile(
            env.evidence_path,
            true,
            JSON.stringify([
              { id: 1, title: 'foo 1' },
              { id: 2, title: 'foo 2' },
            ])
          )
          expect(result.exitCode).to.equal(0)
        }
      )

      it.each(supportedAuthMethods)(
        `should fetch file from github and save it for auth method "%s"`,
        async (authMethod: SupportedAuthMethod) => {
          const env = {
            ...defaultEnvironment,
            GIT_FETCHER_SERVER_AUTH_METHOD: authMethod,
            GIT_FETCHER_SERVER_TYPE: 'github',
            GIT_FETCHER_API_TOKEN:
              authMethod === 'token' ? 'someToken' : undefined,
            GIT_FETCHER_USERNAME: authMethod === 'basic' ? 'john' : undefined,
            GIT_FETCHER_PASSWORD: authMethod === 'basic' ? 'secret' : undefined,
            GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-github.yml`,
          }

          const result: RunProcessResult = await run(
            gitFetcherExecutable,
            undefined,
            {
              env: env,
            }
          )

          await verifyOutputFile(
            env.evidence_path,
            true,
            JSON.stringify([
              {
                id: 1,
                title: 'Dummy PR',
                state: 'open',
                labels: [
                  {
                    id: 1,
                    url: 'www.foo.bar',
                    name: 'ignore',
                    default: false,
                  },
                ],
              },
            ])
          )
          expect(result.exitCode).to.equal(0)
        }
      )
    })
  })

  describe('Error Cases', () => {
    let options: MockServerOptions
    beforeEach(() => {
      options = getGitPullRequestsMockOptions(MOCK_SERVER_PORT, 400)
    })

    it('should throw error if env variable GIT_FETCHER_SERVER_AUTH_METHOD and GIT_FETCHER_API_TOKEN are undefined', async () => {
      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: undefined,
        GIT_FETCHER_SERVER_TYPE: 'github',
        GIT_FETCHER_API_TOKEN: undefined,
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-bitbucket.yml`,
      }

      mockServer = new MockServer(options)

      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        env,
        '{"status":"FAILED","reason":"GIT_FETCHER_API_TOKEN environment variable is required for \\"token\\" authentication, but is not set or empty."}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })

    it.each([undefined, '   '])(
      'should throw error if env variable GIT_FETCHER_USERNAME is "%s" for auth method "basic"',
      async (username) => {
        const env = {
          ...defaultEnvironment,
          GIT_FETCHER_SERVER_AUTH_METHOD: 'basic',
          GIT_FETCHER_USERNAME: username,
          GIT_FETCHER_PASSWORD: 'secret',
          GIT_FETCHER_SERVER_TYPE: 'github',
        }
        mockServer = new MockServer(options)

        await verifyErrorCase(
          mockServer,
          gitFetcherExecutable,
          env,
          '{"status":"FAILED","reason":"GIT_FETCHER_USERNAME environment variable is required for \\"basic\\" authentication, but is not set or empty."}',
          'expected'
        )
        expect(mockServer.getNumberOfRequests()).toEqual(0)
      }
    )

    it.each([undefined, '   '])(
      'should throw error if env variable GIT_FETCHER_PASSWORD is "%s" for auth method "basic"',
      async (password) => {
        const env = {
          ...defaultEnvironment,
          GIT_FETCHER_SERVER_AUTH_METHOD: 'basic',
          GIT_FETCHER_USERNAME: 'John',
          GIT_FETCHER_PASSWORD: password,
          GIT_FETCHER_SERVER_TYPE: 'github',
        }
        mockServer = new MockServer(options)

        await verifyErrorCase(
          mockServer,
          gitFetcherExecutable,
          env,
          '{"status":"FAILED","reason":"GIT_FETCHER_PASSWORD environment variable is required for \\"basic\\" authentication, but is not set or empty."}',
          'expected'
        )
        expect(mockServer.getNumberOfRequests()).toEqual(0)
      }
    )

    it('should throw error if env variable GIT_FETCHER_SERVER_AUTH_METHOD has unsupported value', async () => {
      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'invalid',
        GIT_FETCHER_SERVER_TYPE: 'github',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-bitbucket.yml`,
      }

      mockServer = new MockServer(options)

      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        env,
        '{"status":"FAILED","reason":"No valid authentication method provided. Valid authentication methods are: token,basic"}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })

    it('should throw error for auth method "token" if the token itself is empty', async () => {
      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_SERVER_TYPE: 'bitbucket',
        GIT_FETCHER_API_TOKEN: '    ',
      }

      mockServer = new MockServer(options)

      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        env,
        '{"status":"FAILED","reason":"GIT_FETCHER_API_TOKEN environment variable is required for \\"token\\" authentication, but is not set or empty."}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })
  })
})
