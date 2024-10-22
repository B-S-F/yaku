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
} from './fixtures/getGithubCommitsMetadataAndDiffMockServerResponse'

describe('Fetch Commits Metadata from Github', () => {
  const MOCK_SERVER_PORT = 8080
  const githubStartCommitEndpoint =
    '/repos/aquatest/github-fetcher-test-repo/commits/afeaebf412c6d0b865a36cfdec37fdb46c0fab63'
  const githubEndCommitEndpoint =
    '/repos/aquatest/github-fetcher-test-repo/commits/8036cf75f4b7365efea76cbd716ef12d352d7d29'
  const githubDiffEndpoint =
    '/repos/aquatest/github-fetcher-test-repo/compare/afeaebf412c6d0b865a36cfdec37fdb46c0fab63...8036cf75f4b7365efea76cbd716ef12d352d7d29'
  const githubCommitsMetadataEndpoint =
    '/repos/aquatest/github-fetcher-test-repo/commits'

  const environment = {
    evidence_path: `${__dirname}/evidence`,
    NODE_EXTRA_CA_CERTS: MOCK_SERVER_CERT_PATH,
    GIT_FETCHER_SERVER_API_URL: `https://localhost:${MOCK_SERVER_PORT}`,
    GIT_FETCHER_SERVER_TYPE: 'github',
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
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-fetch-commits-metadata-and-diff-from-github.yml`,
      },
    })

    // verify process result
    expect(result.exitCode).toEqual(0)
    expect(result.stdout).toHaveLength(6)
    expect(result.stdout[0]).toEqual(
      'Fetched metadata about starting commit at 2023-03-06T14:11:29Z'
    )
    expect(result.stdout[1]).toEqual(
      'Fetched metadata about ending commit at 2023-07-12T10:46:50Z'
    )
    expect(result.stdout[2]).toEqual(
      'Fetched 2 lines added and 98 lines removed'
    )
    expect(result.stdout[3]).toEqual('Fetched metadata about 5 commits')
    expect(result.stdout[4]).toEqual(
      'Fetch from https://localhost:8080 was successful with config {"org":"aquatest","repo":"github-fetcher-test-repo","resource":"metadata-and-diff","filter":{"startHash":"afeaebf412c6d0b865a36cfdec37fdb46c0fab63","endHash":"8036cf75f4b7365efea76cbd716ef12d352d7d29"},"filePath":"apps/git-fetcher/src/fetchers/git-fetcher.ts"}'
    )
    expect(result.stdout[5]).toEqual(
      '{"output":{"git-fetcher-result":"git-fetcher-data.json"}}'
    )
    expect(result.stderr).toHaveLength(0)

    // verify requests
    expect(mockServer.getNumberOfRequests()).toEqual(7)

    let requests: ReceivedRequest[] = mockServer.getRequests(
      githubStartCommitEndpoint,
      'get'
    )
    expect(requests).toHaveLength(1)
    verifyHeaders(requests[0].headers)

    requests = mockServer.getRequests(githubEndCommitEndpoint, 'get')
    expect(requests).toHaveLength(1)
    verifyHeaders(requests[0].headers)

    requests = mockServer.getRequests(githubDiffEndpoint, 'get')
    expect(requests).toHaveLength(1)
    verifyHeaders(requests[0].headers)

    requests = mockServer.getRequests(githubCommitsMetadataEndpoint, 'get')
    expect(requests).toHaveLength(4)
    verifyHeaders(requests[0].headers)
    verifyHeaders(requests[1].headers)
    verifyHeaders(requests[2].headers)
    verifyHeaders(requests[3].headers)

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
      mockServerOptions.responses[githubCommitsMetadataEndpoint].get[0]
        .responseBody[0].commit,
      mockServerOptions.responses[githubCommitsMetadataEndpoint].get[0]
        .responseBody[1].commit,
      mockServerOptions.responses[githubCommitsMetadataEndpoint].get[1]
        .responseBody[0].commit,
      mockServerOptions.responses[githubCommitsMetadataEndpoint].get[1]
        .responseBody[1].commit,
      mockServerOptions.responses[githubCommitsMetadataEndpoint].get[2]
        .responseBody[0].commit,
    ]
    expectedFileContent.diff = {
      linesAdded: [
        '\n+export interface GitFetcher<T> {',
        '\n+  fetchResource(): Promise<T[] | T>',
      ],
      linesRemoved: [
        "\n-import { GitServerConfig } from '../model/git-server-config'",
        "\n-import { ConfigFileData } from '../model/config-file-data'",
        "\n-import { handleResponseStatus } from '../utils/handle-response-status.js'",
        '\n-',
        '\n-export class GitFetcher {',
        '\n-  constructor(public env: GitServerConfig, public config: ConfigFileData) {}',
        '\n-',
        '\n-  public pullRequestValidInputs = [',
        "\n-    'pull-request',",
        "\n-    'pull-requests',",
        "\n-    'pr',",
        "\n-    'prs',",
        "\n-    'pullrequest',",
        "\n-    'pullrequests',",
        "\n-    'pull',",
        "\n-    'pulls',",
        '\n-  ]',
        '\n-',
        '\n-  public validateResourceName(resource: string) {',
        "\n-    if (this.env.gitServerType == 'bitbucket') {",
        '\n-      if (this.pullRequestValidInputs.includes(resource.toLocaleLowerCase())) {',
        "\n-        return 'pull-requests'",
        '\n-      } else {',
        '\n-        throw new Error(`${resource} resource name not valid`)',
        '\n-      }',
        "\n-    } else if (this.env.gitServerType == 'github') {",
        '\n-      if (this.pullRequestValidInputs.includes(resource.toLocaleLowerCase())) {',
        "\n-        return 'pulls'",
        '\n-      } else {',
        '\n-        throw new Error(`${resource} resource name not valid`)',
        '\n-      }',
        '\n-    } else {',
        '\n-      throw new Error(`${this.env.gitServerType} server type not supported`)',
        '\n-    }',
        '\n-  }',
        '\n-',
        '\n-  public async getOptions() {',
        "\n-    if (this.env.gitServerAuthMethod.toLocaleLowerCase() == 'basic') {",
        '\n-      const options = {',
        "\n-        method: 'GET',",
        '\n-        auth: {',
        '\n-          username: this.env.gitServerUsername,',
        '\n-          password: this.env.gitServerPassword,',
        '\n-        },',
        '\n-        headers: {',
        "\n-          Accept: 'application/vnd.github+json',",
        '\n-        },',
        '\n-      }',
        '\n-      return options',
        "\n-    } else if (this.env.gitServerAuthMethod.toLocaleLowerCase() == 'token') {",
        '\n-      const options = {',
        "\n-        method: 'GET',",
        '\n-        headers: {',
        "\n-          Accept: 'application/json',",
        '\n-          Authorization: `Bearer ${this.env.gitServerApiToken}`,',
        '\n-        },',
        '\n-      }',
        '\n-      return options',
        '\n-    } else {',
        "\n-      throw new Error('No valid auth method provided')",
        '\n-    }',
        '\n-  }',
        '\n-',
        '\n-  public async buildUrl(resource: string) {',
        '\n-    const resourceName = this.validateResourceName(resource)',
        "\n-    if (this.env.gitServerType == 'bitbucket') {",
        '\n-      const endpoint = `${this.env.gitServerApiUrl.replace(',
        '\n-        //*$/,',
        "\n-        ''",
        '\n-      )}/projects/${this.config.data.org}/repos/${',
        '\n-        this.config.data.repo',
        '\n-      }/${resourceName}?state=ALL`',
        '\n-      return endpoint',
        "\n-    } else if (this.env.gitServerType == 'github') {",
        "\n-      const endpoint = `${this.env.gitServerApiUrl.replace(//*$/, '')}/repos/${",
        '\n-        this.config.data.org',
        '\n-      }/${this.config.data.repo}/${resourceName}?state=all&per_page=100`',
        '\n-      return endpoint',
        '\n-    } else {',
        '\n-      throw new Error(`${this.env.gitServerType} server type not supported`)',
        '\n-    }',
        '\n-  }',
        '\n-',
        '\n-  public async runQuery() {',
        '\n-    const url = await this.buildUrl(this.config.data.resource)',
        '\n-    const options = await this.getOptions()',
        '\n-    try {',
        '\n-      const response = await fetch(url, options)',
        '\n-      if (response.status != 200) {',
        '\n-        handleResponseStatus(response.status)',
        '\n-      }',
        '\n-      return response.json()',
        '\n-    } catch (error: any) {',
        '\n-      throw new Error(',
        '\n-        `Got the following error when running Git fetcher: ${error.message}`',
        '\n-      )',
        '\n-    }',
        '\n-  }',
      ],
    }
    expect(actualFileContent).toStrictEqual(JSON.stringify(expectedFileContent))
  })

  it('should throw an error, if bitbucket returns 404 NOT FOUND error', async () => {
    mockServerOptions =
      getGitCommitsMetadataAndDiffErrorMockServerResponse(MOCK_SERVER_PORT)
    mockServer = new MockServer(mockServerOptions)

    const result: RunProcessResult = await run(gitFetcherExecutable, [], {
      env: {
        ...environment,
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-fetch-commits-metadata-and-diff-from-github.yml`,
      },
    })

    // gitfetcher should throw error
    expect(result.exitCode).toEqual(1)
    expect(result.stderr).toContain(
      'Error: Repository not found. Status code: 404'
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
