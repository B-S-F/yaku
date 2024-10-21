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
import { BitbucketTag } from '../../src/model/bitbucket-tag'
import {
  getGitTagsErrorMockServerResponse,
  getGitTagsSuccessMockServerResponse,
} from './fixtures/getGitTagsSuccessMockServerResponse'

describe('Fetch Tags from Bitbucket', () => {
  const MOCK_SERVER_PORT = 8080
  const getTagsEndpoint =
    '/projects/aquatest/repos/bitbucket-fetcher-test-repo/tags'

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

  it('should successfully fetch all three pages of tags', async () => {
    mockServerOptions = getGitTagsSuccessMockServerResponse(MOCK_SERVER_PORT)
    mockServer = new MockServer(mockServerOptions)
    const result: RunProcessResult = await run(gitFetcherExecutable, [], {
      env: {
        ...environment,
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-fetch-tags-from-bitbucket.yml`,
      },
    })

    // verify process result
    expect(result.exitCode).toEqual(0)
    expect(result.stdout).toHaveLength(3)
    expect(result.stdout[0]).toEqual('Fetched 5 tags')
    expect(result.stdout[1]).toEqual(
      'Fetch from https://localhost:8080 was successful with config {"org":"aquatest","repo":"bitbucket-fetcher-test-repo","resource":"tags"}'
    )
    expect(result.stdout[2]).toEqual(
      '{"output":{"git-fetcher-result":"git-fetcher-data.json"}}'
    )

    expect(result.stderr).toHaveLength(0)

    // verify requests
    expect(mockServer.getNumberOfRequests()).toEqual(3)
    const requests: ReceivedRequest[] = mockServer.getRequests(
      getTagsEndpoint,
      'get'
    )
    expect(requests).toHaveLength(3)

    const requestForFirstPage = requests[0]
    verifyHeaders(requestForFirstPage.headers)
    let expectedPageStart = '0'
    expect(requestForFirstPage.query.start).toEqual(expectedPageStart)

    const requestForSecondPage = requests[1]
    verifyHeaders(requestForSecondPage.headers)
    expectedPageStart = `${mockServerOptions.responses[getTagsEndpoint].get[0].responseBody.nextPageStart}`
    expect(requestForSecondPage.query.start).toEqual(expectedPageStart)

    const requestForThirdPage = requests[2]
    verifyHeaders(requestForThirdPage.headers)
    expectedPageStart = `${mockServerOptions.responses[getTagsEndpoint].get[1].responseBody.nextPageStart}`
    expect(requestForThirdPage.query.start).toEqual(expectedPageStart)

    // verify output file
    const outputFilePath = `${environment.evidence_path}/git-fetcher-data.json`
    expect(fs.existsSync(outputFilePath)).toEqual(true)
    const actualFileContent: string = fs.readFileSync(outputFilePath, {
      encoding: 'utf-8',
    })
    const expectedFileContent: BitbucketTag[] = [
      ...mockServerOptions.responses[getTagsEndpoint].get[0].responseBody
        .values,
      ...mockServerOptions.responses[getTagsEndpoint].get[1].responseBody
        .values,
      ...mockServerOptions.responses[getTagsEndpoint].get[2].responseBody
        .values,
    ]
    expect(actualFileContent).toStrictEqual(JSON.stringify(expectedFileContent))
  })

  it('should throw an error, if bitbucket returns 404 NOT FOUND error', async () => {
    mockServerOptions = getGitTagsErrorMockServerResponse(MOCK_SERVER_PORT)
    mockServer = new MockServer(mockServerOptions)

    const result: RunProcessResult = await run(gitFetcherExecutable, [], {
      env: {
        ...environment,
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-fetch-tags-from-bitbucket.yml`,
      },
    })

    // gitfetcher should throw error
    expect(result.exitCode).toEqual(0)
    expect(result.stdout).toContain(
      '{"status":"FAILED","reason":"Repository not found. Status code: 404"}'
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
