import * as fs from 'fs'
import * as path from 'path'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import {
  MockServer,
  MockServerOptions,
  RunProcessResult,
  run,
} from '../../../../integration-tests/src/util'
import { createMockServerOptions } from '../fixtures/serverHelper'
import { integrationTestResultsAlertsFixtureGREEN } from '../fixtures/alerts'
import { integrationTestResultsRecommendationsFixtureGREEN } from '../fixtures/recommendations'

describe('Defender Autopilot GREEN status cases', () => {
  let mockServer: MockServer | undefined
  const communEnvVariables = {
    TENANT_ID: 'mockedTenantId',
    CLIENT_ID: 'mockedClientId',
    CLIENT_SECRET: 'mockedClientSecret',
    SUBSCRIPTION_ID: 'mockedSubscriptionId',
    IS_INTEGRATION_TEST: 'true',
  }

  const defenderAutopilotExecutable: string = path.join(
    __dirname,
    '..',
    '..',
    'dist',
    'index.js',
  )

  beforeAll(() => {
    expect(fs.existsSync(defenderAutopilotExecutable)).to.equal(true)
  })

  afterEach(async () => {
    await mockServer?.stop()
    mockServer = undefined
  })

  it('should return 0 alerts and GREEN status when no alerts with given ALERT_TYPE_FILTER are found', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'alerts',
          ALERT_TYPE_FILTER: 'RandomAlertType',
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsAlertsFixtureGREEN.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
    expect(result.stderr).to.have.length(0)
  })

  it('should return 0 alerts and GREEN status when no alerts with given KEY_WORDS_FILTER are found', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'alerts',
          KEY_WORDS_FILTER: 'RandomKeyword1',
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsAlertsFixtureGREEN.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
    expect(result.stderr).to.have.length(0)
  })

  it('should return 0 alerts and GREEN status when no alerts with given RESOURCE_NAME_FILTER are found', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'alerts',
          RESOURCE_NAME_FILTER: 'RandomResourceName',
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsAlertsFixtureGREEN.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
    expect(result.stderr).to.have.length(0)
  })

  it('should return 0 alerts and GREEN status when no alerts with all filters given are found', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'alerts',
          ALERT_TYPE_FILTER: 'RandomAlert',
          KEY_WORDS_FILTER: 'RandomKeyword',
          RESOURCE_NAME_FILTER: 'RandomName',
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsAlertsFixtureGREEN.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
    expect(result.stderr).to.have.length(0)
  })

  it('should return 0 recommendations and GREEN status when no recommendations with given SEVERITY_FILTER are found', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'recommendations',
          SEVERITY_FILTER: 'RandomSeverity',
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixtureGREEN.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
    expect(result.stderr).to.have.length(0)
  })

  it('should return 0 recommendations and GREEN status when no recommendations with given KEY_WORDS_FILTER are found', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'recommendations',
          KEY_WORDS_FILTER: 'RandomKeyword',
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixtureGREEN.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
    expect(result.stderr).to.have.length(0)
  })

  it('should return 0 recommendations and GREEN status when no recommendations with given CATEGORIES_FILTER are found', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'recommendations',
          CATEGORIES_FILTER: 'RandomCategories',
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixtureGREEN.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
    expect(result.stderr).to.have.length(0)
  })

  it('should return 0 recommendations and GREEN status when no recommendations with given THREATS_FILTER are found', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'recommendations',
          THREATS_FILTER: 'RandomThreat',
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixtureGREEN.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
    expect(result.stderr).to.have.length(0)
  })

  it('should return 0 recommendations and GREEN status when no recommendations with given USER_IMPACT_FILTER are found', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'recommendations',
          USER_IMPACT_FILTER: 'RandomUserImpact',
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixtureGREEN.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
    expect(result.stderr).to.have.length(0)
  })

  it('should return 0 recommendations and GREEN status when no recommendations with given IMPLEMENTATION_EFFORT_FILTER are found', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'recommendations',
          IMPLEMENTATION_EFFORT_FILTER: 'RandomImplementationEffort',
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stdout).to.not.have.length(0)
    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixtureGREEN.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
    expect(result.stderr).to.have.length(0)
  })
})
