import { SupportedAuthMethod } from '../../src/model/git-server-config'
import { AllowedFilterStateType } from '../../src/model/config-file-data'
import { expect } from 'vitest'
import {
  MOCK_SERVER_CERT_PATH,
  MockServer,
  ReceivedRequest,
  run,
  RunProcessResult,
} from '../../../../integration-tests/src/util'
import { existsSync, promises as fs } from 'fs'

export const gitFetcherExecutable = `${__dirname}/../../dist/index.js`
export const MOCK_SERVER_PORT = 8080
export const defaultEnvironment = {
  evidence_path: `${__dirname}/evidence`,
  GIT_FETCHER_SERVER_API_URL: `https://localhost:${MOCK_SERVER_PORT}`,
  NODE_EXTRA_CA_CERTS: MOCK_SERVER_CERT_PATH,
}

export function verifyPrRequest(
  mockServer: MockServer,
  requestUrl: string,
  authMethod: SupportedAuthMethod,
  filterState: AllowedFilterStateType = 'ALL'
): void {
  const request: ReceivedRequest = mockServer.getRequests(requestUrl, 'get')[0]
  expect(request.query.state).toEqual(filterState)
  verifyAuthorizationHeader(authMethod, request)
}

export function verifyCommitRequest(
  mockServer: MockServer,
  requestUrl: string,
  authMethod: SupportedAuthMethod,
  expectedNumberOfRequests = 1
) {
  const requests: ReceivedRequest[] = mockServer.getRequests(requestUrl, 'get')
  expect(requests.length).toBe(expectedNumberOfRequests)
  requests.forEach((request) => verifyAuthorizationHeader(authMethod, request))
}

export function verifyAuthorizationHeader(
  authMethod: SupportedAuthMethod,
  request: ReceivedRequest
) {
  if (authMethod === 'token') {
    expect(request.headers.authorization).toEqual('Bearer someToken')
    expect(request.headers.accept).toEqual('application/json')
  } else if (authMethod === 'basic') {
    expect(request.headers.authorization).toEqual('Basic am9objpzZWNyZXQ=')
    expect(request.headers.accept).toEqual('application/vnd.github+json')
  }
}

export async function verifyOutputFile(
  evidencePath: string | undefined,
  shouldFileExist: boolean,
  expectedContent?: string
): Promise<void> {
  const outputFilePath = `${evidencePath}/git-fetcher-data.json`

  const existsFile = existsSync(outputFilePath)
  expect(existsFile).toBe(shouldFileExist)

  if (shouldFileExist) {
    const file = await fs.readFile(outputFilePath, { encoding: 'utf8' })
    expect(file).toStrictEqual(expectedContent)
  }
}

export async function verifyErrorCase(
  mockServer: MockServer,
  gitFetcherExecutable,
  env: NodeJS.ProcessEnv,
  expectedErrorMessage: string | RegExp,
  kind: 'expected' | 'unexpected'
) {
  const result: RunProcessResult = await run(gitFetcherExecutable, undefined, {
    env: env,
  })
  await verifyOutputFile(env.evidence_path, false)
  switch (kind) {
    case 'expected':
      expect(result.stdout[0]).toEqual(expectedErrorMessage)
      expect(result.exitCode).to.equal(0)
      break
    case 'unexpected':
      expect(result.stderr).toContain(expectedErrorMessage)
      expect(result.exitCode).to.equal(1)
      break
  }
}
