import * as fs from 'fs'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  MockServer,
  MockServerOptions,
  ReceivedRequest,
  run,
  RunProcessResult,
} from '../../../../integration-tests/src/util'
import { BitbucketCommit } from '../../src/model/bitbucket-commit'
import { BitbucketTag } from '../../src/model/bitbucket-tag'
import {
  bitBucketPrs,
  createBitbucketCommits,
  createBitbucketTags,
  getBitbucketResponseOptions,
  PULL_REQUESTS_ENDPOINT,
  requestUrlCommit,
  requestUrlTag,
} from './fixtures/getBitbucketResponseOptions'
import {
  defaultEnvironment,
  gitFetcherExecutable,
  MOCK_SERVER_PORT,
  verifyAuthorizationHeader,
  verifyOutputFile,
} from './utils'

describe('Tag Filter', () => {
  let mockServer: MockServer

  beforeAll(() => {
    expect(fs.existsSync(gitFetcherExecutable)).toBe(true)
  })

  beforeEach(() => {
    fs.mkdirSync(defaultEnvironment.evidence_path)
  })

  afterEach(async () => {
    fs.rmSync(defaultEnvironment.evidence_path, {
      recursive: true,
    })
    await mockServer?.stop()
  })

  describe('Success Cases', () => {
    describe('For Bitbucket', () => {
      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_SERVER_TYPE: 'bitbucket',
      } as const

      /** Contains mock tag mock responses from the mock server */
      let tagResponses: [BitbucketTag, BitbucketTag]

      /** Contains mock commit responses from the mock server */
      let commitResponses: [BitbucketCommit, BitbucketCommit]

      /**
       * Starts a {@link MockServer}, which mocks PR responses, commit responses (where the commits have the respective
       * dates) and tag responses (which link to those commits).
       * Stores {@link tagResponses} and {@link commitResponses} for later use inside the test cases.
       * @param firstCommitDate timestamp for the first mocked commit
       * @param secondCommitDate timestamp for the second mocked commit
       */
      function startBitbucketMockServer(
        firstCommitDate: Date,
        secondCommitDate: Date
      ): void {
        commitResponses = createBitbucketCommits(
          firstCommitDate,
          secondCommitDate
        )
        tagResponses = createBitbucketTags(commitResponses)
        const options: MockServerOptions = getBitbucketResponseOptions({
          port: MOCK_SERVER_PORT,
          pullRequestResponses: bitBucketPrs,
          commitResponses: commitResponses,
          tagResponses: tagResponses,
        })
        mockServer = new MockServer(options)
      }

      /**
       * Verifies if the expected requests were made to the {@link MockServer}. Makes use of {@link tagResponses} and
       * {@link commitResponses} to recreate the correct request URLs so that it can check the requests sent to those
       * URLs.
       * @param filterByEndTag - if set to <code>true</code> or not defined, verifies that two requests for tags and
       * likewise, two requests for commits were sent. If set to <code>false</code>, verifies that one request for tags
       * and one request for commits was sent.
       */
      function verifyBitbucketRequests(
        filterByEndTag = true,
        expectedStateFilter = 'ALL'
      ): void {
        const expectedNumberOfRequests: number = filterByEndTag ? 5 : 3
        expect(mockServer.getNumberOfRequests()).toEqual(
          expectedNumberOfRequests
        )

        // verify requests for GET pull requests
        let requests: ReceivedRequest[] = mockServer.getRequests(
          PULL_REQUESTS_ENDPOINT,
          'get'
        )
        expect(requests).length(1)
        verifyAuthorizationHeader(
          env.GIT_FETCHER_SERVER_AUTH_METHOD,
          requests[0]
        )
        expect(requests[0].query.state).toEqual(expectedStateFilter)
        expect(requests[0].query.start).toEqual('0')

        // verify request for first tag
        requests = mockServer.getRequests(
          requestUrlTag(tagResponses[0].displayId),
          'get'
        )
        expect(requests).length(1)
        verifyAuthorizationHeader(
          env.GIT_FETCHER_SERVER_AUTH_METHOD,
          requests[0]
        )

        // verify request for second tag, if an endTag filter was provided
        if (filterByEndTag) {
          requests = mockServer.getRequests(
            requestUrlTag(tagResponses[1].displayId),
            'get'
          )
          expect(requests).length(1)
          verifyAuthorizationHeader(
            env.GIT_FETCHER_SERVER_AUTH_METHOD,
            requests[0]
          )
        }

        // verify request for first commit
        requests = mockServer.getRequests(
          requestUrlCommit(commitResponses[0].id),
          'get'
        )
        expect(requests).length(1)
        verifyAuthorizationHeader(
          env.GIT_FETCHER_SERVER_AUTH_METHOD,
          requests[0]
        )

        // verify request for second commit, if an endTag filter was provided
        if (filterByEndTag) {
          requests = mockServer.getRequests(
            requestUrlCommit(commitResponses[1].id),
            'get'
          )
          expect(requests).length(1)
          verifyAuthorizationHeader(
            env.GIT_FETCHER_SERVER_AUTH_METHOD,
            requests[0]
          )
        }
      }

      it('should filter pull requests by startTag and endTag - fetches and writes all PRs', async () => {
        startBitbucketMockServer(
          new Date('2020-02-01'),
          new Date('22023-03-15')
        )
        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/tag-filter/git-fetcher-config-valid-start-and-end-tag.yml`,
            },
          }
        )

        // verify result
        expect(result.exitCode).toEqual(0)
        expect(result.stderr).length(0)
        expect(result.stdout[0]).toEqual('Fetched 4 pull requests')

        // should write all PRs to the output file
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify(bitBucketPrs)
        )

        // verify requests
        verifyBitbucketRequests()
      })

      it('should filter pull requests by startTag and endTag - fetches and writes no PRs, because the endTag references a commit which is older than the oldest PR', async () => {
        startBitbucketMockServer(new Date('2018-12-01'), new Date('2019-05-31'))
        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/tag-filter/git-fetcher-config-valid-start-and-end-tag.yml`,
            },
          }
        )

        // verify result
        expect(result.exitCode).toEqual(0)
        expect(result.stderr).length(0)
        expect(result.stdout[0]).toEqual('Fetched 0 pull requests')

        // should write empty output file
        await verifyOutputFile(env.evidence_path, true, '[]')

        // verify requests
        verifyBitbucketRequests()
      })

      it('should filter pull requests by startTag and endTag - fetches and writes no PRs, because startTag references a commit which is younger than the youngest PR', async () => {
        startBitbucketMockServer(new Date('2023-04-01'), new Date('2023-05-31'))
        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/tag-filter/git-fetcher-config-valid-start-and-end-tag.yml`,
            },
          }
        )

        // verify result
        expect(result.exitCode).toEqual(0)
        expect(result.stderr).length(0)
        expect(result.stdout[0]).toEqual('Fetched 0 pull requests')

        // should write empty output file
        await verifyOutputFile(env.evidence_path, true, '[]')

        // verify requests
        verifyBitbucketRequests()
      })

      it('should filter pull requests by startTag - fetches and writes all PRs, because startTag references a commit which is older than the oldest PR', async () => {
        // second date is older than oldest PR, so that the test proves it is not used for the filtering
        startBitbucketMockServer(new Date('2020-01-01'), new Date('2020-01-02'))
        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/tag-filter/git-fetcher-config-valid-start-tag.yml`,
            },
          }
        )

        // verify result
        expect(result.exitCode).toEqual(0)
        expect(result.stderr).length(0)
        expect(result.stdout[0]).toEqual('Fetched 4 pull requests')

        // should write all PRs to the output file
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify(bitBucketPrs)
        )

        // verify requests
        verifyBitbucketRequests(false)
      })

      it('should filter pull requests by startTag and endTag - fetches and writes PRs from years 2021 and 2022', async () => {
        startBitbucketMockServer(new Date('2021-01-01'), new Date('2022-12-31'))
        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/tag-filter/git-fetcher-config-valid-start-and-end-tag.yml`,
            },
          }
        )

        // verify result
        expect(result.exitCode).toEqual(0)
        expect(result.stderr).length(0)
        expect(result.stdout[0]).toEqual('Fetched 2 pull requests')

        // should write two PRs to the output file
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify([bitBucketPrs[1], bitBucketPrs[2]])
        )

        // verify requests
        verifyBitbucketRequests()
      })

      it('should filter pull requests by startTag, endTag and state - fetches and writes OPEN PRs from year 2022', async () => {
        // filtering by state is done in the GET request to bitbucket's PR endpoint, so this is tested by verifying
        // the query parameter. For consistent results the tags filter one PR which is OPEN.
        startBitbucketMockServer(new Date('2022-01-01'), new Date('2022-12-31'))
        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/tag-filter/git-fetcher-config-valid-state-and-tag.yml`,
            },
          }
        )

        // verify result
        expect(result.exitCode).toEqual(0)
        expect(result.stderr).length(0)
        expect(result.stdout[0]).toEqual('Fetched 1 pull request')

        // should write two PRs to the output file
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify([bitBucketPrs[2]])
        )

        // verify requests - checking on filter state 'OPEN' proves that tag and state filtering work together
        verifyBitbucketRequests(true, 'OPEN')
      })
    })
  })

  describe('Error Cases', () => {
    describe('For Bitbucket', () => {
      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_SERVER_TYPE: 'bitbucket',
      } as const

      it('should fail if tag could not be found', async () => {
        const commitResponses = createBitbucketCommits(
          new Date('2020-01-01'),
          new Date('2023-05-31')
        )
        const options: MockServerOptions = getBitbucketResponseOptions({
          port: MOCK_SERVER_PORT,
          pullRequestResponses: bitBucketPrs,
          commitResponses: commitResponses,
        })
        // should be requested, but fail with error
        options.responses[requestUrlTag('tag1')] = {
          get: {
            responseStatus: 404,
          },
        }
        // should not be requested
        options.responses[requestUrlTag('tag2')] = {
          get: {
            responseStatus: 404,
          },
        }
        mockServer = new MockServer(options)

        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/tag-filter/git-fetcher-config-valid-start-and-end-tag.yml`,
            },
          }
        )

        // verify result
        expect(result.exitCode).toEqual(0)
        expect(result.stdout).toContain(
          '{"status":"FAILED","reason":"Could not retrieve the tag tag1"}'
        )

        // should not write an output file
        await verifyOutputFile(env.evidence_path, false)

        // verify requests
        expect(mockServer.getNumberOfRequests()).toEqual(2)

        // verify request for PRs
        let requests: ReceivedRequest[] = mockServer.getRequests(
          PULL_REQUESTS_ENDPOINT,
          'get'
        )
        expect(requests).length(1)
        verifyAuthorizationHeader(
          env.GIT_FETCHER_SERVER_AUTH_METHOD,
          requests[0]
        )
        expect(requests[0].query.state).toEqual('ALL')
        expect(requests[0].query.start).toEqual('0')

        // verify request for tag 1
        requests = mockServer.getRequests(requestUrlTag('tag1'), 'get')
        expect(requests).length(1)
        verifyAuthorizationHeader(
          env.GIT_FETCHER_SERVER_AUTH_METHOD,
          requests[0]
        )
      })
    })
  })
})
