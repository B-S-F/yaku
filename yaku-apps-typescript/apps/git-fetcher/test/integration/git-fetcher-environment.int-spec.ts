import * as fs from 'fs'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  MockServer,
  MockServerOptions,
} from '../../../../integration-tests/src/util'
import {
  defaultEnvironment,
  gitFetcherExecutable,
  MOCK_SERVER_PORT,
  verifyErrorCase,
} from './utils'
import { getGitPullRequestsMockOptions } from './fixtures/getGitPullRequestsMockServerResponse'

describe('Environment', () => {
  let mockServer: MockServer | undefined

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

  describe('Error Cases', () => {
    it('env variable NODE_TLS_REJECT_UNAUTHORIZED is set to 0', async () => {
      const options: MockServerOptions = getGitPullRequestsMockOptions(
        MOCK_SERVER_PORT,
        400
      )

      const env = {
        ...defaultEnvironment,
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_SERVER_TYPE: 'github',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-bitbucket.yml`,
      }

      mockServer = new MockServer(options)

      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        env,
        '{"status":"FAILED","reason":"NODE_TLS_REJECT_UNAUTHORIZED environment variable is set to 0 which is not allowed"}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })

    it('env variable GIT_FETCHER_SERVER_TYPE is undefined', async () => {
      const options: MockServerOptions = getGitPullRequestsMockOptions(
        MOCK_SERVER_PORT,
        400
      )

      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_SERVER_TYPE: undefined,
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-bitbucket.yml`,
      }

      mockServer = new MockServer(options)

      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        env,
        '{"status":"FAILED","reason":"GIT_FETCHER_SERVER_TYPE environment variable is not set\\nThe server type \\"undefined\\" is not supported"}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })

    it('env variable GIT_FETCHER_SERVER_TYPE has unsupported type', async () => {
      const options: MockServerOptions = getGitPullRequestsMockOptions(
        MOCK_SERVER_PORT,
        400
      )

      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_SERVER_TYPE: 'unsupported_server_type',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-bitbucket.yml`,
      }

      mockServer = new MockServer(options)

      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        env,
        '{"status":"FAILED","reason":"The server type \\"unsupported_server_type\\" is not supported"}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })

    it('env variable GIT_FETCHER_SERVER_API_URL is undefined', async () => {
      const options: MockServerOptions = getGitPullRequestsMockOptions(
        MOCK_SERVER_PORT,
        400
      )

      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_API_URL: undefined,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_SERVER_TYPE: 'github',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-bitbucket.yml`,
      }

      mockServer = new MockServer(options)

      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        env,
        '{"status":"FAILED","reason":"GIT_FETCHER_SERVER_API_URL environment variable is not set.'
        +'\\nGIT_FETCHER_SERVER_API_URL environment variable must use secured connections with https"}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })

    it('should fail for insecure http connection', async () => {
      const options: MockServerOptions = getGitPullRequestsMockOptions(
        MOCK_SERVER_PORT,
        400
      )
      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_API_URL: `http://localhost:${MOCK_SERVER_PORT}`,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_SERVER_TYPE: 'bitbucket',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-bitbucket.yml`,
      }

      mockServer = new MockServer(options)

      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        env,
        '{"status":"FAILED","reason":"GIT_FETCHER_SERVER_API_URL environment variable must use secured connections with https"}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })
  })
})
