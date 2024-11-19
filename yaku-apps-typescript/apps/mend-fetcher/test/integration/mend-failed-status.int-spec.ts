import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import {
  MockServer,
  MockServerOptions,
  RunProcessResult,
  run,
} from '../../../../integration-tests/src/util'
import {
  defaultEnvironment,
  mendFetcherExecutable,
  MOCK_SERVER_PORT,
} from './utils'
import {
  getFAILEDEmptyFixture,
  getFAILEDLoginFixture,
  getFAILEDProjectFixture,
  getFAILEDRandomApiFailureFixture,
} from './fixtures/failedStatusFixtures'
import * as fs_sync from 'fs'

describe('FAILED status scenarios', () => {
  let mockServer: MockServer

  beforeAll(() => {
    expect(fs_sync.existsSync(mendFetcherExecutable)).to.be.equal(true)
  })

  afterEach(async () => {
    await mockServer?.stop()
  })

  it('should set status to FAILED when environment variables are missing', async () => {
    const env = {}
    const options: MockServerOptions =
      await getFAILEDEmptyFixture(MOCK_SERVER_PORT)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      mendFetcherExecutable,
      undefined,
      { env: env },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(result.stdout).to.include(
      JSON.stringify({
        status: 'FAILED',
        reason:
          'Environment validation failed: MEND_API_URL Required, MEND_SERVER_URL Required, MEND_ORG_TOKEN Required, MEND_PROJECT_TOKEN Required, MEND_USER_EMAIL Required, MEND_USER_KEY Required',
      }),
    )
    expect(result.stderr).to.not.have.length(0)
  })

  it.each([
    { name: 'MEND_API_URL', value: 'foo.bar', errorMessage: 'Invalid url' },
    { name: 'MEND_SERVER_URL', value: 'bar.foo', errorMessage: 'Invalid url' },
    {
      name: 'MEND_ORG_TOKEN',
      value: '',
      errorMessage: 'String must contain at least 1 character(s)',
    },
    {
      name: 'MEND_PROJECT_ID',
      value: 'confused',
      errorMessage: 'Must be a number or numbers splitted by a comma.',
    },
    {
      name: 'MEND_PROJECT_TOKEN',
      value: '',
      errorMessage: 'String must contain at least 1 character(s)',
    },
    { name: 'MEND_USER_EMAIL', value: 'foo', errorMessage: 'Invalid email' },
    {
      name: 'MEND_USER_KEY',
      value: '',
      errorMessage: 'String must contain at least 1 character(s)',
    },
    {
      name: 'MEND_REPORT_TYPE',
      value: 'invalid report type',
      errorMessage:
        `Invalid enum value. ` +
        `Expected 'alerts' | 'vulnerabilities', received 'invalid report type'`,
    },
    {
      name: 'MEND_ALERTS_STATUS',
      value: 'nonexisting alerts status',
      errorMessage:
        `Invalid enum value. Expected 'all' | 'active' | 'ignored' | 'library_removed' | 'library_in_house' | 'library_whitelist', ` +
        `received 'nonexisting alerts status'`,
    },
    {
      name: 'MEND_MIN_CONNECTION_TIME',
      value: 'infinity',
      errorMessage: 'Expected number, received not a number',
    },
    {
      name: 'MEND_MAX_CONCURRENT_CONNECTIONS',
      value: 'boatloads',
      errorMessage: 'Expected number, received not a number',
    },
  ])(
    'should set status to FAILED when environment variable $name fails validation',
    async (envVariable) => {
      const env = { ...defaultEnvironment }
      env[`${envVariable.name}`] = envVariable.value
      const options: MockServerOptions =
        await getFAILEDEmptyFixture(MOCK_SERVER_PORT)
      mockServer = new MockServer(options)

      const result: RunProcessResult = await run(
        mendFetcherExecutable,
        undefined,
        { env: env },
      )

      expect(result.exitCode).to.be.equal(0)
      expect(result.stdout).to.not.have.length(0)
      expect(result.stdout).to.include(
        JSON.stringify({
          status: 'FAILED',
          reason:
            `Environment validation failed:` +
            ` ${envVariable.name}` +
            ` ${envVariable.errorMessage}`,
        }),
      )
      expect(result.stderr).to.not.have.length(0)
    },
  )

  it('should set status to FAILED when login fails', async () => {
    const env = { ...defaultEnvironment }
    const options: MockServerOptions =
      await getFAILEDLoginFixture(MOCK_SERVER_PORT)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      mendFetcherExecutable,
      undefined,
      { env: env },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(result.stdout).to.include(
      JSON.stringify({
        status: 'FAILED',
        reason: 'Response status code 401: Login failed',
      }),
    )
    expect(result.stderr).to.not.have.length(0)
  })

  it('should set status to FAILED when project does not exists', async () => {
    const env = { ...defaultEnvironment }
    const options: MockServerOptions = await getFAILEDProjectFixture(
      MOCK_SERVER_PORT,
      { org: env.MEND_ORG_TOKEN, project: env.MEND_PROJECT_TOKEN },
    )
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      mendFetcherExecutable,
      undefined,
      { env: env },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(result.stdout).to.include(
      JSON.stringify({
        status: 'FAILED',
        reason: 'Response status code 404: Entity not found',
      }),
    )
    expect(result.stderr).to.not.have.length(0)
  })

  it('should set status to FAILED when Mend API endpoint fails', async () => {
    const env = { ...defaultEnvironment }
    const successResponseStatus = 200
    const failedResponseStatus = 500
    const options: MockServerOptions = await getFAILEDRandomApiFailureFixture(
      MOCK_SERVER_PORT,
      successResponseStatus,
      failedResponseStatus,
      { org: env.MEND_ORG_TOKEN, project: env.MEND_PROJECT_TOKEN },
    )
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      mendFetcherExecutable,
      undefined,
      { env: env },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(result.stdout).to.include(
      JSON.stringify({
        status: 'FAILED',
        reason: `Response status code ${failedResponseStatus}: Response Error Message`,
      }),
    )
    expect(result.stderr).to.not.have.length(0)
  })
})
