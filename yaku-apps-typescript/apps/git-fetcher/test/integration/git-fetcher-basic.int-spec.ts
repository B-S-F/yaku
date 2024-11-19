// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import * as fs from 'fs'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  MockServer,
  MockServerOptions,
  run,
  RunProcessResult,
} from '../../../../integration-tests/src/util'
import { getGitPullRequestsMockOptions } from './fixtures/getGitPullRequestsMockServerResponse'
import { SupportedAuthMethod } from '../../src/model/git-server-config'
import {
  defaultEnvironment,
  gitFetcherExecutable,
  MOCK_SERVER_PORT,
  verifyErrorCase,
  verifyOutputFile,
  verifyPrRequest,
} from './utils'

describe('Basic', () => {
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
    const options: MockServerOptions = getGitPullRequestsMockOptions(
      MOCK_SERVER_PORT,
      200
    )

    it('should fetch file from github but should return empty string, when label filter does not match pr-labels', async () => {
      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_SERVER_TYPE: 'github',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-github-wrong-label.yml`,
      }

      mockServer = new MockServer(options)

      const result: RunProcessResult = await run(
        gitFetcherExecutable,
        undefined,
        {
          env: env,
        }
      )

      await verifyOutputFile(env.evidence_path, true, JSON.stringify([]))
      expect(result.exitCode).to.equal(0)
    })
  })

  describe('Error Cases', () => {
    it('git fetch response with status code 404', async () => {
      const options: MockServerOptions = getGitPullRequestsMockOptions(
        MOCK_SERVER_PORT,
        404
      )

      const authMethod: SupportedAuthMethod = 'token'
      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: authMethod,
        GIT_FETCHER_SERVER_TYPE: 'bitbucket',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-bitbucket.yml`,
      }

      mockServer = new MockServer(options)

      const result: RunProcessResult = await run(
        gitFetcherExecutable,
        undefined,
        {
          env: env,
        }
      )

      expect(mockServer.getNumberOfRequests()).toEqual(1)
      verifyPrRequest(mockServer, requestUrlPullRequests, authMethod)
      await verifyOutputFile(env.evidence_path, false)
      expect(result.stdout).contain(
        '{"status":"FAILED","reason":"Repository not found. Status code: 404"}'
      )
      expect(result.exitCode).to.equal(0)
    })

    it.each([401, 403])(
      'git fetch response with status code %i',
      async (statusCode) => {
        const authMethod: SupportedAuthMethod = 'token'
        const env = {
          ...defaultEnvironment,
          GIT_FETCHER_SERVER_AUTH_METHOD: authMethod,
          GIT_FETCHER_SERVER_TYPE: 'bitbucket',
          GIT_FETCHER_API_TOKEN: 'someToken',
          GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-bitbucket.yml`,
        }
        const options: MockServerOptions = getGitPullRequestsMockOptions(
          MOCK_SERVER_PORT,
          statusCode
        )
        mockServer = new MockServer(options)

        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: env,
          }
        )

        expect(mockServer.getNumberOfRequests()).toEqual(1)
        verifyPrRequest(mockServer, requestUrlPullRequests, authMethod)
        await verifyOutputFile(env.evidence_path, false)
        expect(result.stdout).contain(
          `{"status":"FAILED","reason":"Could not access the required repository. Status code: ${statusCode}"}`
        )
        expect(result.exitCode).to.equal(0)
      }
    )

    it(`git fetch response with status code 500 (other than 2xx and 4xx)`, async () => {
      const authMethod: SupportedAuthMethod = 'token'
      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: authMethod,
        GIT_FETCHER_SERVER_TYPE: 'bitbucket',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-bitbucket.yml`,
      }
      const options: MockServerOptions = getGitPullRequestsMockOptions(
        MOCK_SERVER_PORT,
        500
      )
      mockServer = new MockServer(options)

      const result: RunProcessResult = await run(
        gitFetcherExecutable,
        undefined,
        {
          env: env,
        }
      )

      expect(mockServer.getNumberOfRequests()).toEqual(1)
      verifyPrRequest(mockServer, requestUrlPullRequests, authMethod)
      await verifyOutputFile(env.evidence_path, false)
      expect(result.stderr).contain(
        'Error: Could not fetch data from git repository. Status code: 500'
      )
      expect(result.exitCode).to.equal(1)
    })

    it('git fetcher config yaml has invalid structure', async () => {
      const options: MockServerOptions = getGitPullRequestsMockOptions(
        MOCK_SERVER_PORT,
        400
      )

      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_SERVER_TYPE: 'github',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-invalid-structure.yml`,
      }

      mockServer = new MockServer(options)

      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        env,
        '{"status":"FAILED","reason":"Validation error: Required at \\"resource\\""}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })

    it('git fetcher config yaml has invalid values', async () => {
      const options: MockServerOptions = getGitPullRequestsMockOptions(
        MOCK_SERVER_PORT,
        400
      )

      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_SERVER_TYPE: 'github',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-invalid-values.yml`,
      }

      mockServer = new MockServer(options)

      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        env,
        "{\"status\":\"FAILED\",\"reason\":\"Validation error: String must contain at least 1 character(s) at \\\"repo\\\"; Invalid enum value. Expected 'pull-request' | 'pull-requests' | 'pr' | 'prs' | 'pullrequest' | 'pullrequests' | 'pull' | 'pulls' | 'branches' | 'tags' | 'metadata-and-diff', received '  ' at \\\"resource\\\"\"}",
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })
  })
})
