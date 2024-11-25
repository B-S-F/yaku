import * as fs from 'fs'
import { IncomingHttpHeaders } from 'http'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  MOCK_SERVER_CERT_PATH,
  MockServer,
  MockServerOptions,
  ReceivedRequest,
  run,
  RunProcessResult,
} from '../../../../integration-tests/src/util'
import { CommitsMetadataAndDiff } from '../../src/model/commits-metadata-and-diff'
import {
  getGitCommitsMetadataAndDiffErrorMockServerResponse,
  getGitCommitsMetadataAndDiffMockServerResponse,
} from './fixtures/getBitbucketCommitsMetadataAndDiffMockServerResponse'

describe('Fetch Commits Metadata from Bitbucket', () => {
  const MOCK_SERVER_PORT = 8080
  const getCommitsMetadataEndpoint =
    '/projects/aquatest/repos/bitbucket-fetcher-test-repo/commits'
  const getDiffEndpoint =
    '/projects/aquatest/repos/bitbucket-fetcher-test-repo/diff/Somefolder/something.py'

  const environment = {
    evidence_path: `${__dirname}/evidence`,
    NODE_EXTRA_CA_CERTS: MOCK_SERVER_CERT_PATH,
    GIT_FETCHER_SERVER_API_URL: `https://localhost:${MOCK_SERVER_PORT}`,
    GIT_FETCHER_SERVER_TYPE: 'bitbucket',
    GIT_FETCHER_API_TOKEN: 'someToken',
  } as const

  const gitFetcherExecutable = `${__dirname}/../../dist/index.js`
  let mockServerOptions: MockServerOptions
  let mockServer: MockServer

  beforeAll(() => {
    expect(fs.existsSync(gitFetcherExecutable)).toBe(true)
  })

  beforeEach(() => {
    fs.mkdirSync(environment.evidence_path)
  })

  afterEach(async () => {
    await mockServer?.stop()

    fs.rmSync(environment.evidence_path, {
      recursive: true,
    })
  })

  it('should successfully fetch all three pages of commits', async () => {
    mockServerOptions =
      getGitCommitsMetadataAndDiffMockServerResponse(MOCK_SERVER_PORT)
    mockServer = new MockServer(mockServerOptions)
    const result: RunProcessResult = await run(gitFetcherExecutable, [], {
      env: {
        ...environment,
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-fetch-commits-metadata-and-diff-from-bitbucket.yml`,
      },
    })

    // verify process result
    expect(result.exitCode).toEqual(0)
    expect(result.stdout).toHaveLength(4)
    expect(result.stdout[0]).toEqual('Fetched medata about 5 commits')
    expect(result.stdout[1]).toEqual('Fetched 1 diff')
    expect(result.stdout[2]).toEqual(
      'Fetch from https://localhost:8080 was successful with config {"org":"aquatest","repo":"bitbucket-fetcher-test-repo","resource":"metadata-and-diff","filter":{"startHash":"35cc5eec543e69aed90503f21cf12666bcbfda4f"},"filePath":"Somefolder/something.py"}',
    )
    expect(result.stdout[3]).toEqual(
      '{"output":{"git-fetcher-result":"git-fetcher-data.json"}}',
    )

    expect(result.stderr).toHaveLength(0)

    // verify requests
    expect(mockServer.getNumberOfRequests()).toEqual(4)

    let requests: ReceivedRequest[] = mockServer.getRequests(
      getCommitsMetadataEndpoint,
      'get',
    )
    expect(requests).toHaveLength(3)

    const requestForFirstPage = requests[0]
    verifyHeaders(requestForFirstPage.headers)
    let expectedPageStart = '0'
    expect(requestForFirstPage.query.start).toEqual(expectedPageStart)

    const requestForSecondPage = requests[1]
    verifyHeaders(requestForSecondPage.headers)
    expectedPageStart = `${mockServerOptions.responses[getCommitsMetadataEndpoint].get[0].responseBody.nextPageStart}`
    expect(requestForSecondPage.query.start).toEqual(expectedPageStart)

    const requestForThirdPage = requests[2]
    verifyHeaders(requestForThirdPage.headers)
    expectedPageStart = `${mockServerOptions.responses[getCommitsMetadataEndpoint].get[1].responseBody.nextPageStart}`
    expect(requestForThirdPage.query.start).toEqual(expectedPageStart)

    requests = mockServer.getRequests(getDiffEndpoint, 'get')
    expect(requests).toHaveLength(1)

    // verify output file
    const outputFilePath = `${environment.evidence_path}/git-fetcher-data.json`
    expect(fs.existsSync(outputFilePath)).toEqual(true)
    const actualFileContent: string = fs.readFileSync(outputFilePath, {
      encoding: 'utf-8',
    })
    const expectedFileContent: CommitsMetadataAndDiff = {
      commitsMetadata: [],
      diff: [],
    }
    expectedFileContent.commitsMetadata = [
      ...mockServerOptions.responses[getCommitsMetadataEndpoint].get[0]
        .responseBody.values,
      ...mockServerOptions.responses[getCommitsMetadataEndpoint].get[1]
        .responseBody.values,
      ...mockServerOptions.responses[getCommitsMetadataEndpoint].get[2]
        .responseBody.values,
    ]
    expectedFileContent.diff = [
      ...mockServerOptions.responses[getDiffEndpoint].get[0].responseBody.diffs,
    ]
    expect(actualFileContent).toStrictEqual(JSON.stringify(expectedFileContent))
  })

  it('should throw an error, if bitbucket returns 404 NOT FOUND error', async () => {
    mockServerOptions =
      getGitCommitsMetadataAndDiffErrorMockServerResponse(MOCK_SERVER_PORT)
    mockServer = new MockServer(mockServerOptions)

    const result: RunProcessResult = await run(gitFetcherExecutable, [], {
      env: {
        ...environment,
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-fetch-commits-metadata-and-diff-from-bitbucket.yml`,
      },
    })

    // gitfetcher should throw error
    expect(result.exitCode).toEqual(1)
    expect(result.stderr).toContain(
      'Error: Repository not found. Status code: 404',
    )

    // gitfetcher should not write an output file
    const outputFilePath = `${environment.evidence_path}/git-fetcher-data.json`
    expect(fs.existsSync(outputFilePath)).toEqual(false)
  })
})

function verifyHeaders(headers: IncomingHttpHeaders): void {
  expect(headers.accept).toEqual('application/json')
  expect(headers.authorization).toEqual('Bearer someToken')
}
