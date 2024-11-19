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
import {
  integrationTestResultsAlertsFixture1,
  integrationTestResultsAlertsFixture2,
  integrationTestResultsAlertsFixture3,
} from '../fixtures/alerts'
import {
  integrationTestResultsRecommendationsFixture1,
  integrationTestResultsRecommendationsFixture2,
  integrationTestResultsRecommendationsFixture3,
} from '../fixtures/recommendations'

describe('Defender Autopilot RED status cases', () => {
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
    expect(fs.existsSync(defenderAutopilotExecutable)).to.be.true
  })

  afterEach(async () => {
    await mockServer?.stop()
    mockServer = undefined
  })

  it('should return 4 alerts when no filters are applied', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          DATA_TYPE: 'alerts',
          ...communEnvVariables,
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsAlertsFixture1.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 3 alerts when ALERT_TYPE_FILTER = "K8S_, RandomPrefix" is applied', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'alerts',
          ALERT_TYPE_FILTER: 'K8S_, RandomPrefix',
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsAlertsFixture2.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 1 alert when KEY_WORDS_FILTER = "RandomKeyword1, suspicious download, RandomKeyword2" is applied', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'alerts',
          KEY_WORDS_FILTER:
            'RandomKeyword1, suspicious download, RandomKeyword2',
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsAlertsFixture3.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 3 alerts when RESOURCE_NAME_FILTER = "xyz, unn, zyx" is applied', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'alerts',
          RESOURCE_NAME_FILTER: 'xyz, unn, zyx',
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsAlertsFixture2.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 1 alert when ALERT_TYPE_FILTER = "K8S_, K8S.NODE_" and KEY_WORDS_FILTER = "RandomKeyword1, suspicious download, RandomKeyword2" are applied', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'alerts',
          ALERT_TYPE_FILTER: 'K8S_, K8S.NODE_',
          KEY_WORDS_FILTER:
            'RandomKeyword1, suspicious download, RandomKeyword2',
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsAlertsFixture3.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 1 alert when ALERT_TYPE_FILTER = "RandomPrefix, K8S.NODE_" and RESOURCE_NAME_FILTER = "xyz, unn, yzx, 1aks"', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'alerts',
          ALERT_TYPE_FILTER: 'RandomPrefix, K8S.NODE_',
          RESOURCE_NAME_FILTER: 'xyz, unn, yzx, 1aks',
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsAlertsFixture3.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 4 alerts when KEY_WORDS_FILTER = "container, RandomKeyword1, processes, RandomKeyword2" and RESOURCE_NAME_FILTER = "xyz, unn, yzx, 1aks"', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'alerts',
          KEY_WORDS_FILTER:
            'container, RandomKeyword1, processes, RandomKeyword2',
          RESOURCE_NAME_FILTER: 'xyz, unn, yzx, 1aks',
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsAlertsFixture1.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 3 alerts when ALERT_TYPE_FILTER = "K8S_, K8S.NODE_", KEY_WORDS_FILTER = "RandomKeyword1, RandomKeyword2, container, processes" and RESOURCE_NAME_FILTER = "xyz, yzx, unn"', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...communEnvVariables,
          DATA_TYPE: 'alerts',
          ALERT_TYPE_FILTER: 'K8S_, K8S.NODE_',
          KEY_WORDS_FILTER:
            'RandomKeyword1, RandomKeyword2, container, processes',
          RESOURCE_NAME_FILTER: 'xyz, yzx, unn',
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsAlertsFixture2.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 3 recommendations when no filters are applied', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          DATA_TYPE: 'recommendations',
          ...communEnvVariables,
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixture1.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 2 recommendations when SEVERITY_FILTER = "High"', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          DATA_TYPE: 'recommendations',
          SEVERITY_FILTER: 'High',
          ...communEnvVariables,
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixture2.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 1 recommendation when KEY_WORDS_FILTER = "GKE cluster"', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          DATA_TYPE: 'recommendations',
          KEY_WORDS_FILTER: 'GKE cluster',
          ...communEnvVariables,
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixture3.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 1 recommendation when CATEGORIES_FILTER = "Compute"', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          DATA_TYPE: 'recommendations',
          CATEGORIES_FILTER: 'Compute',
          ...communEnvVariables,
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixture3.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 2 recommendations when THREATS_FILTER = "MaliciousInsider, DataSpillage"', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          DATA_TYPE: 'recommendations',
          THREATS_FILTER: 'MaliciousInsider, DataSpillage',
          ...communEnvVariables,
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixture2.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 2 recommendations when USER_IMPACT_FILTER = "High"', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          DATA_TYPE: 'recommendations',
          USER_IMPACT_FILTER: 'High',
          ...communEnvVariables,
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixture2.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 1 recommendation when IMPLEMENTATION_EFFORT_FILTER = "Low"', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          DATA_TYPE: 'recommendations',
          IMPLEMENTATION_EFFORT_FILTER: 'Low',
          ...communEnvVariables,
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixture3.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 1 recommendation when IMPLEMENTATION_EFFORT_FILTER = "Low" and THREATS_FILTER = "MaliciousInsider', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          DATA_TYPE: 'recommendations',
          IMPLEMENTATION_EFFORT_FILTER: 'Low',
          THREATS_FILTER: 'MaliciousInsider',
          ...communEnvVariables,
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixture3.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 2 recommendations when USER_IMPACT_FILTER = "High" and THREATS_FILTER = "MaliciousInsider', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          DATA_TYPE: 'recommendations',
          USER_IMPACT_FILTER: 'High',
          THREATS_FILTER: 'MaliciousInsider',
          ...communEnvVariables,
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixture2.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 2 recommendations when KEY_WORDS_FILTER = "network" and SEVERITY_FILTER = "High', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          DATA_TYPE: 'recommendations',
          SEVERITY_FILTER: 'High',
          KEY_WORDS_FILTER: 'network',
          ...communEnvVariables,
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixture2.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should return 3 recommendations when KEY_WORDS_FILTER = "network" and SEVERITY_FILTER = "High, Medium', async () => {
    const options: MockServerOptions = await createMockServerOptions(8080, 200)
    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          DATA_TYPE: 'recommendations',
          SEVERITY_FILTER: 'High, Medium',
          KEY_WORDS_FILTER: 'network',
          ...communEnvVariables,
        },
      },
    )

    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsRecommendationsFixture1.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })
})
