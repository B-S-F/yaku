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
import { BitbucketPr } from '../../src/model/bitbucket-pr'
import {
  getBitbucketResponseOptions,
  PULL_REQUESTS_ENDPOINT,
} from './fixtures/getBitbucketResponseOptions'
import {
  defaultEnvironment,
  gitFetcherExecutable,
  MOCK_SERVER_PORT,
  verifyErrorCase,
  verifyOutputFile,
  verifyPrRequest,
} from './utils'

describe('Date Filter', () => {
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
    describe('For Bitbucket', () => {
      const authMethod = 'token'
      const serverType = 'bitbucket'

      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: authMethod,
        GIT_FETCHER_SERVER_TYPE: serverType,
        GIT_FETCHER_API_TOKEN: 'someToken',
      }

      const pullRequests: BitbucketPr[] = [
        {
          id: 1,
          state: 'OPEN',
          updatedDate: 1580515200000, // 01-02-2020 00:00:00
        },
        {
          id: 2,
          state: 'MERGED',
          updatedDate: 1609459200000, // 01-01-2021 00:00:00
        },
        {
          id: 3,
          state: 'OPEN',
          updatedDate: 1678838400000, // 15-03-2023 00:00:00
        },
      ]

      let options: MockServerOptions

      beforeEach(() => {
        options = getBitbucketResponseOptions({
          port: MOCK_SERVER_PORT,
          pullRequestResponses: pullRequests,
        })
        mockServer = new MockServer(options)
      })

      it('should store all pull requests for start date 01-02-2020', async () => {
        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/date-filter/git-fetcher-config-valid-start-01-02-2020.yml`,
            },
          }
        )
        expect(mockServer.getNumberOfRequests()).toEqual(1)
        verifyPrRequest(mockServer, requestUrlPullRequests, authMethod)
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify(pullRequests)
        )
        expect(result.exitCode).to.equal(0)
      })

      it('should store only pull requests between 01-06-2020 and today', async () => {
        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/date-filter/git-fetcher-config-valid-start-01-06-2020.yml`,
            },
          }
        )
        expect(mockServer.getNumberOfRequests()).toEqual(1)
        verifyPrRequest(mockServer, requestUrlPullRequests, authMethod)
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify([pullRequests[1], pullRequests[2]])
        )
        expect(result.exitCode).to.equal(0)
      })

      it('should store pull requests between 01-06-2020 and 31-12-2022', async () => {
        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/date-filter/git-fetcher-config-valid-start-01-06-2020-end-31-12-2022.yml`,
            },
          }
        )
        expect(mockServer.getNumberOfRequests()).toEqual(1)
        verifyPrRequest(mockServer, requestUrlPullRequests, authMethod)
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify([pullRequests[1]])
        )
        expect(result.exitCode).to.equal(0)
      })

      it('should store pull requests between 01-06-2020 and 31-12-2023', async () => {
        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/date-filter/git-fetcher-config-valid-start-01-06-2020-end-31-12-2023.yml`,
            },
          }
        )
        expect(mockServer.getNumberOfRequests()).toEqual(1)
        verifyPrRequest(mockServer, requestUrlPullRequests, authMethod)
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify([pullRequests[1], pullRequests[2]])
        )
        expect(result.exitCode).to.equal(0)
      })

      it('should not store pull requests for date filter from 01-01-2019 to 31-12-2019', async () => {
        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/date-filter/git-fetcher-config-valid-start-01-01-2019-end-31-12-2019.yml`,
            },
          }
        )
        expect(mockServer.getNumberOfRequests()).toEqual(1)
        verifyPrRequest(mockServer, requestUrlPullRequests, authMethod)
        await verifyOutputFile(env.evidence_path, true, JSON.stringify([]))
        expect(result.exitCode).to.equal(0)
      })

      it('should not store pull requests for date filter from 01-01-2024 to 31-12-2024', async () => {
        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/date-filter/git-fetcher-config-valid-start-01-01-2024-end-31-12-2024.yml`,
            },
          }
        )
        expect(mockServer.getNumberOfRequests()).toEqual(1)
        verifyPrRequest(mockServer, requestUrlPullRequests, authMethod)
        await verifyOutputFile(env.evidence_path, true, JSON.stringify([]))
        expect(result.exitCode).to.equal(0)
      })
    })
  })

  describe('Error Cases', () => {
    let options: MockServerOptions

    const env = {
      ...defaultEnvironment,
      GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
      GIT_FETCHER_SERVER_TYPE: 'bitbucket',
      GIT_FETCHER_API_TOKEN: 'someToken',
    }

    beforeEach(() => {
      options = {
        port: MOCK_SERVER_PORT,
        https: true,
        responses: {
          [PULL_REQUESTS_ENDPOINT]: {
            get: {
              responseStatus: 400,
            },
          },
        },
      }
      mockServer = new MockServer(options)
    })

    it('should fail for invalid startDate', async () => {
      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        {
          ...env,
          GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/date-filter/git-fetcher-config-invalid-start-date.yml`,
        },
        '{"status":"FAILED","reason":"Validation error: date must match the format dd-mm-yyyy at \\"filter.startDate\\""}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })

    it('should fail for invalid endDate', async () => {
      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        {
          ...env,
          GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/date-filter/git-fetcher-config-invalid-end-date.yml`,
        },
        '{"status":"FAILED","reason":"Validation error: date must match the format dd-mm-yyyy at \\"filter.endDate\\""}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })

    it('should fail if startDate is after endDate', async () => {
      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_SERVER_TYPE: 'bitbucket',
        GIT_FETCHER_API_TOKEN: 'someToken',
      }

      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        {
          ...env,
          GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/date-filter/git-fetcher-config-invalid-start-date-after-end-date.yml`,
        },
        '{"status":"FAILED","reason":"Validation error: filter.endDate must be after or equal filter.startDate at \\"filter\\""}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })

    it('should fail if endDate is provided but startDate is missing', async () => {
      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        {
          ...env,
          GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/date-filter/git-fetcher-config-invalid-start-date-missing.yml`,
        },
        '{"status":"FAILED","reason":"Validation error: Specify filter.startDate if filter.endDate is provided at \\"filter\\""}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })
  })
})
