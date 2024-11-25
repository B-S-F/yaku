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
import { BitbucketCommit } from '../../src/model/bitbucket-commit'
import {
  bitBucketPrs,
  createBitbucketCommits,
  getBitbucketResponseOptions,
  PULL_REQUESTS_ENDPOINT,
  requestUrlCommit,
} from './fixtures/getBitbucketResponseOptions'
import {
  defaultEnvironment,
  gitFetcherExecutable,
  MOCK_SERVER_PORT,
  verifyCommitRequest,
  verifyErrorCase,
  verifyOutputFile,
  verifyPrRequest,
} from './utils'

describe('Hash Filter', () => {
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

      it('should filter pull requests by startHash and endHash - outputs all pull requests', async () => {
        const commitResponses = createBitbucketCommits(
          new Date('2020-02-01'),
          new Date('2023-03-15'),
        )
        const options: MockServerOptions = getBitbucketResponseOptions({
          port: MOCK_SERVER_PORT,
          pullRequestResponses: bitBucketPrs,
          commitResponses: commitResponses,
        })
        mockServer = new MockServer(options)

        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/hash-filter/git-fetcher-config-valid-start-and-end-hash.yml`,
            },
          },
        )

        expect(mockServer.getNumberOfRequests()).toEqual(3)
        verifyPrRequest(mockServer, PULL_REQUESTS_ENDPOINT, authMethod)
        verifyCommitRequest(
          mockServer,
          requestUrlCommit(commitResponses[0].id),
          authMethod,
        )
        verifyCommitRequest(
          mockServer,
          requestUrlCommit(commitResponses[1].id),
          authMethod,
        )
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify(bitBucketPrs),
        )
        expect(result.exitCode).to.equal(0)
      })

      it('should filter pull requests by startHash and endHash - outputs some pull requests', async () => {
        const commitResponses = createBitbucketCommits(
          new Date('2020-12-01'),
          new Date('2022-05-31'),
        )
        const options: MockServerOptions = getBitbucketResponseOptions({
          port: MOCK_SERVER_PORT,
          pullRequestResponses: bitBucketPrs,
          commitResponses: commitResponses,
        })
        mockServer = new MockServer(options)

        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/hash-filter/git-fetcher-config-valid-start-and-end-hash.yml`,
            },
          },
        )

        expect(mockServer.getNumberOfRequests()).toEqual(3)
        verifyPrRequest(mockServer, PULL_REQUESTS_ENDPOINT, authMethod)
        verifyCommitRequest(
          mockServer,
          requestUrlCommit(commitResponses[0].id),
          authMethod,
        )
        verifyCommitRequest(
          mockServer,
          requestUrlCommit(commitResponses[1].id),
          authMethod,
        )
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify([bitBucketPrs[1], bitBucketPrs[2]]),
        )
        expect(result.exitCode).to.equal(0)
      })

      it('should filter pull requests by startHash and endHash - outputs no pull requests because endHash is earlier than the oldest pull request', async () => {
        const commitResponses = createBitbucketCommits(
          new Date('2018-12-01'),
          new Date('2019-05-31'),
        )
        const options: MockServerOptions = getBitbucketResponseOptions({
          port: MOCK_SERVER_PORT,
          pullRequestResponses: bitBucketPrs,
          commitResponses: commitResponses,
        })
        mockServer = new MockServer(options)

        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/hash-filter/git-fetcher-config-valid-start-and-end-hash.yml`,
            },
          },
        )

        expect(mockServer.getNumberOfRequests()).toEqual(3)
        verifyPrRequest(mockServer, PULL_REQUESTS_ENDPOINT, authMethod)
        verifyCommitRequest(
          mockServer,
          requestUrlCommit(commitResponses[0].id),
          authMethod,
        )
        verifyCommitRequest(
          mockServer,
          requestUrlCommit(commitResponses[1].id),
          authMethod,
        )
        await verifyOutputFile(env.evidence_path, true, JSON.stringify([]))
        expect(result.exitCode).to.equal(0)
      })

      it('should filter pull requests by startHash and endHash - outputs no pull requests because startHash is after the latest pull request', async () => {
        const commitResponses = createBitbucketCommits(
          new Date('2023-04-01'),
          new Date('2023-05-31'),
        )
        const options: MockServerOptions = getBitbucketResponseOptions({
          port: MOCK_SERVER_PORT,
          pullRequestResponses: bitBucketPrs,
          commitResponses: commitResponses,
        })
        mockServer = new MockServer(options)

        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/hash-filter/git-fetcher-config-valid-start-and-end-hash.yml`,
            },
          },
        )

        expect(mockServer.getNumberOfRequests()).toEqual(3)
        verifyPrRequest(mockServer, PULL_REQUESTS_ENDPOINT, authMethod)
        verifyCommitRequest(
          mockServer,
          requestUrlCommit(commitResponses[0].id),
          authMethod,
        )
        verifyCommitRequest(
          mockServer,
          requestUrlCommit(commitResponses[1].id),
          authMethod,
        )
        await verifyOutputFile(env.evidence_path, true, JSON.stringify([]))
        expect(result.exitCode).to.equal(0)
      })

      it('should filter pull requests by startHash - outputs all pull requests', async () => {
        const commitResponse: BitbucketCommit = createBitbucketCommits(
          new Date('2020-01-01'),
          new Date(),
        )[0]
        const options: MockServerOptions = getBitbucketResponseOptions({
          port: MOCK_SERVER_PORT,
          pullRequestResponses: bitBucketPrs,
          commitResponses: [commitResponse],
        })
        mockServer = new MockServer(options)

        const result: RunProcessResult = await run(
          gitFetcherExecutable,
          undefined,
          {
            env: {
              ...env,
              GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/hash-filter/git-fetcher-config-valid-start-hash.yml`,
            },
          },
        )

        expect(mockServer.getNumberOfRequests()).toEqual(2)
        verifyPrRequest(mockServer, PULL_REQUESTS_ENDPOINT, authMethod)
        verifyCommitRequest(
          mockServer,
          requestUrlCommit(commitResponse.id),
          authMethod,
        )
        await verifyOutputFile(
          env.evidence_path,
          true,
          JSON.stringify(bitBucketPrs),
        )
        expect(result.exitCode).to.equal(0)
      })
    })
  })

  describe('Error Cases', () => {
    describe('For Bitbucket', async () => {
      let options: MockServerOptions
      const authMethod = 'token'
      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: authMethod,
        GIT_FETCHER_SERVER_TYPE: 'bitbucket',
        GIT_FETCHER_API_TOKEN: 'someToken',
      }

      it('should fail if commit hash could not be found', async () => {
        options = getBitbucketResponseOptions({
          port: MOCK_SERVER_PORT,
          pullRequestResponses: [
            {
              id: 1,
              state: 'MERGED',
              updatedDate: 1559347200000, // 01-06-2019 ,
            },
            {
              id: 2,
              state: 'MERGED',
              updatedDate: 1625097600000, // 01-07-2021 ,
            },
          ],
        })
        options.responses[
          requestUrlCommit('c11631a0ddccb9579feae43b949b53c369528f43')
        ] = { get: { responseStatus: 404 } }
        mockServer = new MockServer(options)

        await verifyErrorCase(
          mockServer,
          gitFetcherExecutable,
          {
            ...env,
            GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/hash-filter/git-fetcher-config-valid-state-and-hash.yml`,
          },
          '{"status":"FAILED","reason":"Could not retrieve the commit hash c11631a0ddccb9579feae43b949b53c369528f43 (status 404)"}',
          'expected',
        )
        expect(mockServer.getNumberOfRequests()).toEqual(2)
        await verifyPrRequest(
          mockServer,
          PULL_REQUESTS_ENDPOINT,
          authMethod,
          'MERGED',
        )
      })
    })
  })
})
