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
import { getGREENStatusFixture } from './fixtures/greenStatusFixtures'
import {
  organizationData,
  projectData,
  projectVitalsData,
} from './fixtures/data'
import * as fs_sync from 'fs'

describe.each([
  { name: 'MEND_PROJECT_ID', value: '123321,124421' },
  { name: 'MEND_PROJECT_ID', value: undefined },
])('GREEN status scenarios', (envVariable) => {
  let mockServer: MockServer

  beforeAll(() => {
    expect(fs_sync.existsSync(mendFetcherExecutable)).to.be.equal(true)
  })

  afterEach(async () => {
    await mockServer?.stop()
  })

  it.each([
    {
      report: 'alerts',
      noOfRequests: 17,
      reqInfo:
        'login + org + project + project vitals + policy alerts + new versions alerts + multiple licenses alerts + rejected in use alerts + security alerts',
    },
    {
      report: 'vulnerabilities',
      noOfRequests: 15,
      reqInfo:
        'login + org + project + project vitals + libraries(1 + 1) + vulns of lib 1 + vulns of lib 2',
    },
  ])(
    'should set status to GREEN when there are no $report found',
    async (testOptions) => {
      const env = {
        ...defaultEnvironment,
        MEND_REPORT_TYPE: testOptions.report,
      }

      env.MEND_PROJECT_TOKEN = 'project-uuid,project-uuid'
      if (envVariable.value) {
        env[`${envVariable.name}`] = envVariable.value
      }

      const reasonLinkTemplate = (id: number) => {
        if (envVariable.value) {
          return (
            `${env.MEND_SERVER_URL}/Wss/WSS.html#!project;` +
            `orgToken=${organizationData.uuid};` +
            `id=` +
            envVariable.value.split(',')[id]
          )
        }
        return (
          `${env.MEND_SERVER_URL}/Wss/WSS.html` +
          ` in organization ${organizationData.name}` +
          ` and project ${projectData.name}`
        )
      }
      const options: MockServerOptions = await getGREENStatusFixture(
        MOCK_SERVER_PORT,
        200,
        { org: env.MEND_ORG_TOKEN, project: 'project-uuid' }
      )
      mockServer = new MockServer(options)

      const result: RunProcessResult = await run(
        mendFetcherExecutable,
        undefined,
        { env: env }
      )

      expect(result.exitCode).to.be.equal(0)
      expect(result.stdout).to.not.have.length(0)
      expect(result.stdout).to.include(
        JSON.stringify({
          status: 'GREEN',
          reason:
            `No ${env.MEND_REPORT_TYPE} were found, last scan was executed on ${projectVitalsData.lastScan}` +
            ', see more details in Mend ' +
            reasonLinkTemplate(0) +
            '; ' +
            `No ${env.MEND_REPORT_TYPE} were found, last scan was executed on ${projectVitalsData.lastScan}` +
            ', see more details in Mend ' +
            reasonLinkTemplate(1) +
            `;`,
        })
      )
      expect(result.stderr).to.have.length(0)

      const noOfRequests = mockServer.getNumberOfRequests()
      expect(noOfRequests).to.equal(testOptions.noOfRequests)
    }
  )
})
