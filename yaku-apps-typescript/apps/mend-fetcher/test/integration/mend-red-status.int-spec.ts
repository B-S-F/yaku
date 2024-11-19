// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

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
  organizationData,
  projectData,
  projectVitalsData,
} from './fixtures/data'
import { getREDStatusFixture } from './fixtures/redStatusFixtures'
import * as fs_sync from 'fs'

describe.each([
  { name: 'MEND_PROJECT_ID', value: '123921' },
  { name: 'MEND_PROJECT_ID', value: undefined },
])('RED status scenarios', (envVariable) => {
  let mockServer: MockServer
  let reasonLinkTemplate = ';'

  beforeAll(() => {
    expect(fs_sync.existsSync(mendFetcherExecutable)).to.be.equal(true)
  })

  afterEach(async () => {
    await mockServer?.stop()
  })

  it.each([
    {
      report: 'alerts',
      noOfRequests: 14,
      noOfResults: 10,
    },
    {
      report: 'vulnerabilities',
      noOfRequests: 14,
      noOfResults: 4,
    },
  ])('should set status to RED when $report are found', async (testOptions) => {
    const env = {
      ...defaultEnvironment,
      MEND_REPORT_TYPE: testOptions.report,
      VULNERABILITY_ID: 'vulnerability1-name',
      VULNERABILITY_ID2: 'vulnerability2-name',
    }
    if (envVariable.value) {
      env[`${envVariable.name}`] = envVariable.value
      reasonLinkTemplate =
        `${env.MEND_SERVER_URL}/Wss/WSS.html#!project;` +
        `orgToken=${organizationData.uuid};` +
        `id=` +
        env[`${envVariable.name}`]
    } else {
      reasonLinkTemplate =
        `${env.MEND_SERVER_URL}/Wss/WSS.html` +
        ` in organization ${organizationData.name}` +
        ` and project ${projectData.name}`
    }
    const options: MockServerOptions = await getREDStatusFixture(
      MOCK_SERVER_PORT,
      200,
      {
        org: env.MEND_ORG_TOKEN,
        project: env.MEND_PROJECT_TOKEN,
        vulnerabilityId: env.VULNERABILITY_ID,
        vulnerabilityId2: env.VULNERABILITY_ID2,
      },
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
        status: 'RED',
        reason:
          `${testOptions.noOfResults} ${testOptions.report} were found, last scan was executed on ${projectVitalsData.lastScan},` +
          ' see more details in Mend ' +
          reasonLinkTemplate +
          `;`,
      }),
    )
    expect(result.stderr).to.have.length(0)

    const noOfRequests = mockServer.getNumberOfRequests()
    expect(noOfRequests).to.equal(testOptions.noOfRequests)
  })
})
