import * as fs from 'fs'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  MockServer,
  MockServerOptions,
  run,
  RunProcessResult,
} from '../../../../integration-tests/src/util'
import {
  allowedFilterState,
  AllowedFilterStateType,
} from '../../src/model/config-file-data'
import { BitbucketPr } from '../../src/model/bitbucket-pr'
import {
  defaultEnvironment,
  gitFetcherExecutable,
  MOCK_SERVER_PORT,
  verifyCommitRequest,
  verifyErrorCase,
  verifyOutputFile,
  verifyPrRequest,
} from './utils'
import { BitbucketCommit } from '../../src/model/bitbucket-commit'
import {
  getBitbucketResponseOptions,
  PULL_REQUESTS_ENDPOINT,
} from './fixtures/getBitbucketResponseOptions'

describe('State Filter', () => {
  let mockServer: MockServer | undefined

  const requestUrlPullRequests =
    '/projects/aquatest/repos/bitbucket-fetcher-test-repo/pull-requests'

  const requestUrlCommit = (hash: string) =>
    `/projects/aquatest/repos/bitbucket-fetcher-test-repo/commits/${hash}`

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
      } as const

      it.each(allowedFilterState)(
        'should store only pull requests with the state %s from bitbucket',
        async (state: AllowedFilterStateType) => {
          const responses: Record<AllowedFilterStateType, BitbucketPr[]> = {
            DECLINED: [
              { id: 1, state: 'DECLINED', updatedDate: undefined },
              { id: 2, state: 'DECLINED', updatedDate: undefined },
            ],
            MERGED: [
              { id: 3, state: 'MERGED', updatedDate: undefined },
              { id: 4, state: 'MERGED', updatedDate: undefined },
              { id: 5, state: 'MERGED', updatedDate: undefined },
            ],
            OPEN: [{ id: 6, state: 'OPEN', updatedDate: undefined }],
            ALL: [
              { id: 1, state: 'DECLINED', updatedDate: undefined },
              { id: 2, state: 'DECLINED', updatedDate: undefined },
              { id: 3, state: 'MERGED', updatedDate: undefined },
              { id: 4, state: 'MERGED', updatedDate: undefined },
              { id: 5, state: 'MERGED', updatedDate: undefined },
              { id: 6, state: 'OPEN', updatedDate: undefined },
            ],
          }

          const options: MockServerOptions = getBitbucketResponseOptions({
            port: MOCK_SERVER_PORT,
            pullRequestResponses: responses[state],
          })
          mockServer = new MockServer(options)

          const result: RunProcessResult = await run(
            gitFetcherExecutable,
            undefined,
            {
              env: {
                ...env,
                GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/state-filter/git-fetcher-config-bitbucket-${state}.yml`,
              },
            }
          )

          expect(mockServer.getNumberOfRequests()).toEqual(1)
          verifyPrRequest(mockServer, requestUrlPullRequests, authMethod, state)
          await verifyOutputFile(
            env.evidence_path,
            true,
            JSON.stringify(responses[state])
          )
          expect(result.exitCode).to.equal(0)
        }
      )

      it('should filter pull requests if state filter with date filter is used in combination ', async () => {
        const filterState: AllowedFilterStateType = 'MERGED'
        const responses: BitbucketPr[] = [
          {
            id: 1,
            state: 'MERGED',
            updatedDate: 1559347200000 /* 01-06-2019 */,
          },
          {
            id: 2,
            state: 'MERGED',
            updatedDate: 1625097600000 /* 01-07-2021 */,
          },
          {
            id: 3,
            state: 'MERGED',
            updatedDate: 1647306000000 /* 15-03-2022 */,
          },
          {
            id: 4,
            state: 'MERGED',
            updatedDate: 1685577600000 /* 01-06-2023 */,
          },
        ]

        const options: MockServerOptions = getBitbucketResponseOptions({
          port: MOCK_SERVER_PORT,
          pullRequestResponses: responses,
        })
        mockServer = new MockServer(options)

        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/date-filter/git-fetcher-config-valid-state-and-date.yml`,
            },
          }
        )

        expect(mockServer.getNumberOfRequests()).toEqual(1)
        verifyPrRequest(
          mockServer,
          requestUrlPullRequests,
          authMethod,
          filterState
        )
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify([responses[1], responses[2]])
        )
        expect(result.exitCode).to.equal(0)
      })

      it('should filter pull requests if state filter with hash filter is used in combination ', async () => {
        const filterState: AllowedFilterStateType = 'MERGED'

        const pullRequestResponses: BitbucketPr[] = [
          {
            id: 1,
            state: filterState,
            updatedDate: 1559347200000, // 01-06-2019 ,
          },
          {
            id: 2,
            state: filterState,
            updatedDate: 1625097600000, // 01-07-2021 ,
          },
          {
            id: 3,
            state: filterState,
            updatedDate: 1647306000000, // 15-03-2022 ,
          },
          {
            id: 4,
            state: filterState,
            updatedDate: 1685577600000, // 01-06-2023 ,
          },
        ]

        const commitResponses: BitbucketCommit[] = [
          {
            id: 'c11631a0ddccb9579feae43b949b53c369528f43',
            committerTimestamp: 1643670000000, // 01-02-2022
          },
          {
            id: 'a71631a0dcccb957afeae43b949b53c369528f4f',
            committerTimestamp: 1686780000000, // 15-06-2023
          },
        ]

        const options: MockServerOptions = getBitbucketResponseOptions({
          port: MOCK_SERVER_PORT,
          pullRequestResponses: pullRequestResponses,
          commitResponses: commitResponses,
        })
        mockServer = new MockServer(options)

        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/hash-filter/git-fetcher-config-valid-state-and-hash.yml`,
            },
          }
        )

        expect(mockServer.getNumberOfRequests()).toEqual(3)
        verifyPrRequest(
          mockServer,
          requestUrlPullRequests,
          authMethod,
          filterState
        )
        verifyCommitRequest(
          mockServer,
          requestUrlCommit(commitResponses[0].id),
          authMethod
        )
        verifyCommitRequest(
          mockServer,
          requestUrlCommit(commitResponses[1].id),
          authMethod
        )
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify([pullRequestResponses[2], pullRequestResponses[3]])
        )
        expect(result.exitCode).to.equal(0)
      })
    })
  })

  describe('Error Cases', () => {
    it('should fail for invalid filter state', async () => {
      const options: MockServerOptions = {
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

      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_SERVER_TYPE: 'bitbucket',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/state-filter/git-fetcher-config-bitbucket-INVALID.yml`,
      }

      await verifyErrorCase(
        mockServer,
        gitFetcherExecutable,
        env,
        '{"status":"FAILED","reason":"Validation error: Invalid enum value. Expected \'DECLINED\' | \'MERGED\' | \'OPEN\' | \'ALL\', received \'INVALID_STATE\' at \\"filter.state\\""}',
        'expected'
      )
      expect(mockServer.getNumberOfRequests()).toEqual(0)
    })
  })
})
