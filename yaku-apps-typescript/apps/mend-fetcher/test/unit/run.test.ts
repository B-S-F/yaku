/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { run } from '../../src/run'
import { AlertService } from '../../src/service/alert.service'
import { LibraryService } from '../../src/service/library.service'
import { OrganizationService } from '../../src/service/organization.service'
import { ProjectService } from '../../src/service/project.service'
import { VulnerabilityService } from '../../src/service/vulnerability.service'
import {
  RequestError,
  ResponseError,
  UnexpectedDataError,
} from '../../src/fetcher/errors.fetcher'
import {
  librariesModel,
  organizationModel,
  policyAlertsModel,
  newVersionsAlertsModel,
  multipleLicensesAlertsModel,
  rejectedInUseAlertsModel,
  projectModel,
  projectVitalsModel,
  securityAlertsModel,
  vulnerabilitiesModel,
  vulnerabilityFixSummaryModel,
} from './fixtures/model'
import * as autopilotUtils from '@B-S-F/autopilot-utils'
import { vulnerabilitiesFixSummaryData } from './fixtures/data'

describe('run', () => {
  vi.mock('AlertService', () => {
    const AlertService = vi.fn()
    AlertService.prototype.getPolicyAlertsById = vi.fn()
    AlertService.prototype.getSecurityAlertsById = vi.fn()
    AlertService.prototype.getNewVersionsAlertsById = vi.fn()
    AlertService.prototype.getMultipleLicensesAlertsById = vi.fn()
    AlertService.prototype.getRejectedInUseAlertsById = vi.fn()
    return { AlertService }
  })

  vi.mock('../../src/utils/export', () => ({
    exportJson: vi.fn(),
  }))

  vi.mock('../src/service/library.service', () => {
    const LibraryService = vi.fn()
    LibraryService.prototype.getAllLibrariesById = vi.fn()
    return { LibraryService }
  })

  vi.mock('../src/service/organization.service', () => {
    const OrganizationService = vi.fn()
    OrganizationService.prototype.getOrganizationById = vi.fn()
    return { OrganizationService }
  })

  vi.mock('../src/service/project.service', () => {
    const ProjectService = vi.fn()
    ProjectService.prototype.getProjectByToken = vi.fn()
    return { ProjectService }
  })

  vi.mock('../src/service/vulnerability.service', () => {
    const VulnerabilityService = vi.fn()
    VulnerabilityService.prototype.getAllVulnerabilitiesById = vi.fn()
    VulnerabilityService.prototype.getAllVulnerabilitiesFixSummaryById = vi.fn()
    return { VulnerabilityService }
  })

  process.exit = vi.fn()

  beforeEach(() => {
    // clear environment
    delete process.env.MEND_API_URL
    delete process.env.MEND_SERVER_URL
    delete process.env.MEND_ORG_TOKEN
    delete process.env.MEND_PROJECT_ID
    delete process.env.MEND_PROJECT_TOKEN
    delete process.env.MEND_USER_EMAIL
    delete process.env.MEND_USER_KEY
    delete process.env.MEND_REPORT_TYPE
    delete process.env.MEND_ALERTS_STATUS
    delete process.env.MEND_MIN_CONNECTION_TIME
    delete process.env.MEND_MAX_CONCURRENT_CONNECTIONS
    delete process.env.MEND_RESULTS_PATH
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Environment variables validation', () => {
    describe('Undefined required environment variables', () => {
      beforeEach(() => {
        vi.stubEnv('MEND_API_URL', 'https://foo.bar')
        vi.stubEnv('MEND_SERVER_URL', 'https://bar.foo')
        vi.stubEnv('MEND_ORG_TOKEN', 'dummy2-token')
        vi.stubEnv('MEND_PROJECT_TOKEN', 'dummy3-token')
        vi.stubEnv('MEND_USER_EMAIL', 'dummy1@some.gTLD')
        vi.stubEnv('MEND_USER_KEY', 'dummy1-userkey')
      })

      it.each([
        { name: 'MEND_API_URL' },
        { name: 'MEND_SERVER_URL' },
        { name: 'MEND_ORG_TOKEN' },
        { name: 'MEND_PROJECT_TOKEN' },
        { name: 'MEND_USER_EMAIL' },
        { name: 'MEND_USER_KEY' },
      ])(
        'should set status FAILED when $name is not set',
        async (envVariable) => {
          delete process.env[`${envVariable.name}`]
          const spyStatus = vi.spyOn(
            autopilotUtils.AppOutput.prototype,
            'setStatus'
          )
          const spyReason = vi.spyOn(
            autopilotUtils.AppOutput.prototype,
            'setReason'
          )

          expect.assertions(2)
          await run()

          expect(spyStatus).toHaveBeenCalledWith('FAILED')
          expect(spyReason).toHaveBeenCalledWith(
            'Environment validation failed: ' +
              `${envVariable.name} ` +
              'Required'
          )
        }
      )

      it('should set status FAILED when no required env variables are set', async () => {
        delete process.env.MEND_API_URL
        delete process.env.MEND_SERVER_URL
        delete process.env.MEND_ORG_TOKEN
        delete process.env.MEND_PROJECT_TOKEN
        delete process.env.MEND_USER_EMAIL
        delete process.env.MEND_USER_KEY
        const spyStatus = vi.spyOn(
          autopilotUtils.AppOutput.prototype,
          'setStatus'
        )
        const spyReason = vi.spyOn(
          autopilotUtils.AppOutput.prototype,
          'setReason'
        )

        expect.assertions(2)
        await run()

        expect(spyStatus).toHaveBeenCalledWith('FAILED')
        expect(spyReason).toHaveBeenCalledWith(
          `Environment validation failed:` +
            ` MEND_API_URL Required,` +
            ` MEND_SERVER_URL Required,` +
            ` MEND_ORG_TOKEN Required,` +
            ` MEND_PROJECT_TOKEN Required,` +
            ` MEND_USER_EMAIL Required,` +
            ` MEND_USER_KEY Required`
        )
      })
    })

    describe('Empty environment variables', () => {
      beforeEach(() => {
        vi.stubEnv('MEND_API_URL', 'https://foo.bar')
        vi.stubEnv('MEND_SERVER_URL', 'https://bar.foo')
        vi.stubEnv('MEND_ORG_TOKEN', 'dummy2-token')
        vi.stubEnv('MEND_PROJECT_ID', '123321')
        vi.stubEnv('MEND_PROJECT_TOKEN', 'dummy3-token')
        vi.stubEnv('MEND_USER_EMAIL', 'dummy1@some.gTLD')
        vi.stubEnv('MEND_USER_KEY', 'dummy1-userkey')
        vi.stubEnv('MEND_REPORT_TYPE', 'vulnerabilities')
        vi.stubEnv('MEND_ALERTS_STATUS', 'active')
        vi.stubEnv('MEND_MIN_CONNECTION_TIME', '123')
        vi.stubEnv('MEND_MAX_CONCURRENT_CONNECTIONS', '321')
        vi.stubEnv('MEND_RESULTS_PATH', 'dummy4-path')
      })

      afterEach(() => {
        vi.unstubAllEnvs()
        vi.clearAllMocks()
      })

      it.each([
        {
          name: 'MEND_ORG_TOKEN',
          value: '',
          errorMessage: 'String must contain at least 1 character(s)',
        },
        {
          name: 'MEND_PROJECT_TOKEN',
          value: '',
          errorMessage: 'String must contain at least 1 character(s)',
        },
        {
          name: 'MEND_USER_KEY',
          value: '',
          errorMessage: 'String must contain at least 1 character(s)',
        },
      ])(
        'should set status to FAILED when $name is set, but empty',
        async (envVariable) => {
          delete process.env[`${envVariable.name}`]
          vi.stubEnv(`${envVariable.name}`, envVariable.value)
          const spyStatus = vi.spyOn(
            autopilotUtils.AppOutput.prototype,
            'setStatus'
          )
          const spyReason = vi.spyOn(
            autopilotUtils.AppOutput.prototype,
            'setReason'
          )

          expect.assertions(2)
          await run()

          expect(spyStatus).toHaveBeenCalledWith('FAILED')
          expect(spyReason).toHaveBeenCalledWith(
            `Environment validation failed:` +
              ` ${envVariable.name}` +
              ` ${envVariable.errorMessage}`
          )
        }
      )
    })

    describe('Malformed environment variables', () => {
      beforeEach(() => {
        vi.stubEnv('MEND_API_URL', 'https://foo.bar')
        vi.stubEnv('MEND_SERVER_URL', 'https://bar.foo')
        vi.stubEnv('MEND_ORG_TOKEN', 'dummy2-token')
        vi.stubEnv('MEND_PROJECT_ID', '123321,,125521')
        vi.stubEnv(
          'MEND_PROJECT_TOKEN',
          'dummy3-token,dummy2-token,dummy1-token'
        )
        vi.stubEnv('MEND_USER_EMAIL', 'dummy1@some.gTLD')
        vi.stubEnv('MEND_USER_KEY', 'dummy1-userkey')
        vi.stubEnv('MEND_REPORT_TYPE', 'vulnerabilities')
        vi.stubEnv('MEND_ALERTS_STATUS', 'active')
        vi.stubEnv('MEND_MIN_CONNECTION_TIME', '123')
        vi.stubEnv('MEND_MAX_CONCURRENT_CONNECTIONS', '321')
        vi.stubEnv('MEND_RESULTS_PATH', 'dummy4-path')
      })

      afterEach(() => {
        vi.unstubAllEnvs()
        vi.clearAllMocks()
      })

      it.each([
        {
          name: 'MEND_API_URL',
          value: 'foo.bar',
          errorMessage: 'MEND_API_URL Invalid url',
        },
        {
          name: 'MEND_SERVER_URL',
          value: 'bar.foo',
          errorMessage: 'MEND_SERVER_URL Invalid url',
        },
        {
          name: 'MEND_PROJECT_ID',
          value: 'confused',
          errorMessage:
            'MEND_PROJECT_ID Must be a number or numbers splitted by a comma.',
        },
        {
          name: 'MEND_PROJECT_ID',
          value: 'confused,double-confused,tripple-confused',
          errorMessage:
            'MEND_PROJECT_ID Must be a number or numbers splitted by a comma.',
        },
        {
          name: 'MEND_PROJECT_ID',
          value: '123321,',
          errorMessage:
            'MEND_PROJECT_TOKEN and MEND_PROJECT_ID should be of equal length or MEND_PROJECT_ID should be empty.',
        },
        {
          name: 'MEND_PROJECT_TOKEN',
          value: 'dummy3-token,',
          errorMessage: 'MEND_PROJECT_TOKEN Unexpected trailing comma',
        },
        {
          name: 'MEND_PROJECT_TOKEN',
          value: 'dummy3-token,dummy2-token',
          errorMessage:
            'MEND_PROJECT_TOKEN and MEND_PROJECT_ID should be of equal length or MEND_PROJECT_ID should be empty.',
        },
        {
          name: 'MEND_USER_EMAIL',
          value: 'foo',
          errorMessage: 'MEND_USER_EMAIL Invalid email',
        },
        {
          name: 'MEND_REPORT_TYPE',
          value: 'invalid report type',
          errorMessage:
            `MEND_REPORT_TYPE Invalid enum value. ` +
            `Expected 'alerts' | 'vulnerabilities', received 'invalid report type'`,
        },
        {
          name: 'MEND_ALERTS_STATUS',
          value: 'nonexisting alerts status',
          errorMessage:
            `MEND_ALERTS_STATUS Invalid enum value. Expected 'all' | 'active' | 'ignored' | 'library_removed' | 'library_in_house' | 'library_whitelist', ` +
            `received 'nonexisting alerts status'`,
        },
        {
          name: 'MEND_MIN_CONNECTION_TIME',
          value: 'infinity',
          errorMessage:
            'MEND_MIN_CONNECTION_TIME Expected number, received not a number',
        },
        {
          name: 'MEND_MAX_CONCURRENT_CONNECTIONS',
          value: 'boatloads',
          errorMessage:
            'MEND_MAX_CONCURRENT_CONNECTIONS Expected number, received not a number',
        },
      ])(
        'should set status to FAILED when $name is malformed',
        async (envVariable) => {
          delete process.env[`${envVariable.name}`]
          vi.stubEnv(`${envVariable.name}`, envVariable.value)
          const spyStatus = vi.spyOn(
            autopilotUtils.AppOutput.prototype,
            'setStatus'
          )
          const spyReason = vi.spyOn(
            autopilotUtils.AppOutput.prototype,
            'setReason'
          )

          expect.assertions(2)
          await run()

          expect(spyStatus).toHaveBeenCalledWith('FAILED')
          expect(spyReason).toHaveBeenCalledWith(
            `Environment validation failed:` + ` ${envVariable.errorMessage}`
          )
        }
      )
    })
  })

  describe('Expected FAILED status', () => {
    beforeEach(() => {
      vi.stubEnv('MEND_API_URL', 'https://foo.bar')
      vi.stubEnv('MEND_SERVER_URL', 'https://bar.foo')
      vi.stubEnv('MEND_ORG_TOKEN', 'dummy2-token')
      vi.stubEnv('MEND_RPOJECT_ID', '123321')
      vi.stubEnv('MEND_PROJECT_TOKEN', 'dummy3-token')
      vi.stubEnv('MEND_USER_EMAIL', 'dummy1@some.gTLD')
      vi.stubEnv('MEND_USER_KEY', 'dummy1-userkey')
      vi.stubEnv('MEND_REPORT_TYPE', 'vulnerabilities')
      vi.stubEnv('MEND_ALERTS_STATUS', 'active')
      vi.stubEnv('MEND_MIN_CONNECTION_TIME', '123')
      vi.stubEnv('MEND_MAX_CONCURRENT_CONNECTIONS', '321')
      vi.stubEnv('MEND_RESULTS_PATH', 'dummy4-path')
    })

    it('should set status FAILED when an UnexpectedDataError is thrown', async () => {
      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )
      const spyOrg = vi.spyOn(
        OrganizationService.prototype,
        'getOrganizationById'
      )
      spyOrg.mockRejectedValueOnce(
        new UnexpectedDataError('UnexpectedDataError was thrown')
      )

      expect.assertions(2)
      await run()

      expect(spyStatus).toHaveBeenCalledWith('FAILED')
      expect(spyReason).toHaveBeenCalledWith('UnexpectedDataError was thrown')
    })

    it('should set status FAILED when a RequestError is thrown', async () => {
      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )
      const spyOrg = vi.spyOn(
        OrganizationService.prototype,
        'getOrganizationById'
      )
      spyOrg.mockRejectedValueOnce(new RequestError('Error message'))

      expect.assertions(2)
      await run()

      expect(spyStatus).toHaveBeenCalledWith('FAILED')
      expect(spyReason).toHaveBeenCalledWith('RequestError: Error message')
    })

    it('should set status FAILED when a ResponseError is thrown', async () => {
      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )
      const spyOrg = vi.spyOn(
        OrganizationService.prototype,
        'getOrganizationById'
      )
      spyOrg.mockRejectedValueOnce(
        new ResponseError('ResponseError was thrown')
      )

      expect.assertions(2)
      await run()

      expect(spyStatus).toHaveBeenCalledWith('FAILED')
      expect(spyReason).toHaveBeenCalledWith('ResponseError was thrown')
    })
  })

  describe.each([
    { name: 'MEND_PROJECT_ID', value: '123321' },
    { name: 'MEND_PROJECT_ID', value: '123321' },
  ])('Expected RED status', (envVariable) => {
    beforeEach(() => {
      vi.stubEnv('MEND_API_URL', 'https://foo.bar')
      vi.stubEnv('MEND_SERVER_URL', 'https://bar.foo')
      vi.stubEnv('MEND_ORG_TOKEN', 'dummy2-token')
      if (envVariable.value) {
        vi.stubEnv(envVariable.name, envVariable.value)
      }
      vi.stubEnv('MEND_PROJECT_TOKEN', 'dummy3-token')
      vi.stubEnv('MEND_USER_EMAIL', 'dummy1@some.gTLD')
      vi.stubEnv('MEND_USER_KEY', 'dummy1-userkey')
      vi.stubEnv('MEND_REPORT_TYPE', 'vulnerabilities')
      vi.stubEnv('MEND_ALERTS_STATUS', 'active')
      vi.stubEnv('MEND_MIN_CONNECTION_TIME', '123')
      vi.stubEnv('MEND_MAX_CONCURRENT_CONNECTIONS', '321')
      vi.stubEnv('MEND_RESULTS_PATH', 'dummy4-path')
    })

    it('should set RED status when vulnerabilities are found', async () => {
      if (!envVariable.value) {
        delete process.env[`${envVariable.name}`]
      }
      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )
      const spyResult = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'addResult'
      )
      const spyOrganizationService = vi.spyOn(
        OrganizationService.prototype,
        'getOrganizationById'
      )
      spyOrganizationService.mockReturnValueOnce(
        Promise.resolve(organizationModel)
      )
      const spyProjectService = vi.spyOn(
        ProjectService.prototype,
        'getProjectByToken'
      )
      spyProjectService.mockReturnValueOnce(Promise.resolve(projectModel))
      const spyVitalsProjectService = vi.spyOn(
        ProjectService.prototype,
        'getProjectVitals'
      )
      spyVitalsProjectService.mockReturnValueOnce(
        Promise.resolve(projectVitalsModel)
      )
      const spyLibraryService = vi.spyOn(
        LibraryService.prototype,
        'getAllLibrariesById'
      )
      spyLibraryService.mockReturnValueOnce(Promise.resolve(librariesModel))
      const spyVulnerabilityService = vi.spyOn(
        VulnerabilityService.prototype,
        'getAllVulnerabilitiesById'
      )

      const spyVulnerabilityServiceFix = vi.spyOn(
        VulnerabilityService.prototype,
        'getAllVulnerabilitiesFixSummaryById'
      )

      spyVulnerabilityService.mockReturnValueOnce(
        Promise.resolve([vulnerabilitiesModel[0], vulnerabilitiesModel[1]])
      )
      spyVulnerabilityService.mockReturnValueOnce(
        Promise.resolve([vulnerabilitiesModel[1], vulnerabilitiesModel[0]])
      )
      spyVulnerabilityServiceFix.mockReturnValueOnce(
        Promise.resolve(vulnerabilityFixSummaryModel)
      )
      spyVulnerabilityServiceFix.mockReturnValueOnce(
        Promise.resolve(vulnerabilityFixSummaryModel)
      )
      spyVulnerabilityServiceFix.mockReturnValueOnce(
        Promise.resolve(vulnerabilityFixSummaryModel)
      )
      spyVulnerabilityServiceFix.mockReturnValueOnce(
        Promise.resolve(vulnerabilityFixSummaryModel)
      )
      const reasonLinkTemplate =
        envVariable.value !== undefined
          ? `${process.env.MEND_SERVER_URL}/Wss/WSS.html#!project;` +
            `orgToken=${organizationModel.uuid};` +
            `id=${process.env.MEND_PROJECT_ID}`
          : `${process.env.MEND_SERVER_URL}/Wss/WSS.html#!project;` +
            `orgToken=${organizationModel.uuid}`
      const resultLinkTemplate =
        envVariable.value !== undefined
          ? `${process.env.MEND_SERVER_URL}/Wss/WSS.html#!libraryDetails;` +
            `orgToken=${organizationModel.uuid};` +
            `project=${process.env.MEND_PROJECT_ID};`
          : `${process.env.MEND_SERVER_URL}/Wss/WSS.html#!libraryDetails;` +
            `orgToken=${organizationModel.uuid};`

      expect.assertions(vulnerabilitiesModel.length * librariesModel.length + 2)
      await run()
      expect(spyResult).toHaveBeenNthCalledWith(1, {
        criterion: 'Open Vulnerability Mend',
        justification: vulnerabilitiesModel[0].description,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: `${vulnerabilitiesModel[0].name}:${librariesModel[0].name}`,
          severity: vulnerabilitiesModel[0].severity,
          score: `${vulnerabilitiesModel[0].score}`,
          link: resultLinkTemplate + `uuid=${librariesModel[0].uuid};`,
          description: vulnerabilitiesModel[0].description,
          topFix:
            vulnerabilityFixSummaryModel?.topRankedFix.message +
            ' ' +
            vulnerabilitiesFixSummaryData?.topRankedFix.fixResolution,
        },
      })
      expect(spyResult).toHaveBeenNthCalledWith(2, {
        criterion: 'Open Vulnerability Mend',
        justification: vulnerabilitiesModel[1].description,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: `${vulnerabilitiesModel[1].name}:${librariesModel[0].name}`,
          severity: vulnerabilitiesModel[1].severity,
          score: `${vulnerabilitiesModel[1].score}`,
          link: resultLinkTemplate + `uuid=${librariesModel[0].uuid};`,
          description: vulnerabilitiesModel[1].description,
          topFix:
            vulnerabilityFixSummaryModel?.topRankedFix.message +
            ' ' +
            vulnerabilitiesFixSummaryData?.topRankedFix.fixResolution,
        },
      })
      expect(spyResult).toHaveBeenNthCalledWith(3, {
        criterion: 'Open Vulnerability Mend',
        justification: vulnerabilitiesModel[1].description,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: `${vulnerabilitiesModel[1].name}:${librariesModel[1].name}`,
          severity: vulnerabilitiesModel[1].severity,
          score: `${vulnerabilitiesModel[1].score}`,
          link: resultLinkTemplate + `uuid=${librariesModel[1].uuid};`,
          description: vulnerabilitiesModel[1].description,
          topFix:
            vulnerabilityFixSummaryModel?.topRankedFix.message +
            ' ' +
            vulnerabilitiesFixSummaryData?.topRankedFix.fixResolution,
        },
      })
      expect(spyResult).toHaveBeenNthCalledWith(4, {
        criterion: 'Open Vulnerability Mend',
        justification: vulnerabilitiesModel[0].description,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: `${vulnerabilitiesModel[0].name}:${librariesModel[1].name}`,
          severity: vulnerabilitiesModel[0].severity,
          score: `${vulnerabilitiesModel[0].score}`,
          link: resultLinkTemplate + `uuid=${librariesModel[1].uuid};`,
          description: vulnerabilitiesModel[0].description,
          topFix:
            vulnerabilityFixSummaryModel?.topRankedFix.message +
            ' ' +
            vulnerabilitiesFixSummaryData?.topRankedFix.fixResolution,
        },
      })
      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        `${
          vulnerabilitiesModel.length * librariesModel.length
        } vulnerabilities were found, last scan was executed on ${
          projectVitalsModel.lastScan
        }` +
          `, see more details in Mend ` +
          reasonLinkTemplate +
          `${
            envVariable.value === undefined
              ? ' in project ' + projectModel.name + ';'
              : ''
          }` +
          `;`
      )
    })

    it('should set RED status when alerts are found', async () => {
      vi.stubEnv('MEND_REPORT_TYPE', 'alerts')
      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )
      const spyResult = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'addResult'
      )
      const spyOrganizationService = vi.spyOn(
        OrganizationService.prototype,
        'getOrganizationById'
      )
      spyOrganizationService.mockReturnValueOnce(
        Promise.resolve(organizationModel)
      )
      const spyProjectService = vi.spyOn(
        ProjectService.prototype,
        'getProjectByToken'
      )
      spyProjectService.mockReturnValueOnce(Promise.resolve(projectModel))
      const spyVitalsProjectService = vi.spyOn(
        ProjectService.prototype,
        'getProjectVitals'
      )
      spyVitalsProjectService.mockReturnValueOnce(
        Promise.resolve(projectVitalsModel)
      )
      const spyPolicyAlertService = vi.spyOn(
        AlertService.prototype,
        'getPolicyAlertsById'
      )
      spyPolicyAlertService.mockReturnValueOnce(
        Promise.resolve(policyAlertsModel)
      )
      const spyNewVersionAlertService = vi.spyOn(
        AlertService.prototype,
        'getNewVersionsAlertsById'
      )
      spyNewVersionAlertService.mockReturnValueOnce(
        Promise.resolve(newVersionsAlertsModel)
      )
      const spyMultipleLicensesAlertService = vi.spyOn(
        AlertService.prototype,
        'getMultipleLicensesAlertsById'
      )
      spyMultipleLicensesAlertService.mockReturnValueOnce(
        Promise.resolve(multipleLicensesAlertsModel)
      )
      const spyRejectedInUseAlertService = vi.spyOn(
        AlertService.prototype,
        'getRejectedInUseAlertsById'
      )
      spyRejectedInUseAlertService.mockReturnValueOnce(
        Promise.resolve(rejectedInUseAlertsModel)
      )
      const spySecurityAlertService = vi.spyOn(
        AlertService.prototype,
        'getSecurityAlertsById'
      )
      spySecurityAlertService.mockReturnValueOnce(
        Promise.resolve(securityAlertsModel)
      )
      const reasonLinkTemplate =
        envVariable.value !== undefined
          ? `${process.env.MEND_SERVER_URL}/Wss/WSS.html#!project;` +
            `orgToken=${organizationModel.uuid};` +
            `id=${process.env.MEND_PROJECT_ID}`
          : `${process.env.MEND_SERVER_URL}/Wss/WSS.html#!project;` +
            `orgToken=${organizationModel.uuid}`
      const resultLinkTemplate =
        `${process.env.MEND_SERVER_URL}/Wss/WSS.html#!libraryDetails;` +
        `orgToken=${organizationModel.uuid};` +
        `project=${process.env.MEND_PROJECT_ID};`

      expect.assertions(
        policyAlertsModel.length +
          securityAlertsModel.length +
          newVersionsAlertsModel.length +
          multipleLicensesAlertsModel.length +
          rejectedInUseAlertsModel.length +
          2
      )
      await run()

      expect(spyResult).toHaveBeenNthCalledWith(1, {
        criterion: 'Open Policy Alert Mend',
        justification: policyAlertsModel[0].component.name,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: policyAlertsModel[0].component.name,
          status: policyAlertsModel[0].alertInfo.status,
          link:
            resultLinkTemplate + `uuid=${policyAlertsModel[0].component.uuid};`,
          description: policyAlertsModel[0].component.description,
        },
      })
      expect(spyResult).toHaveBeenNthCalledWith(2, {
        criterion: 'Open Policy Alert Mend',
        justification: policyAlertsModel[1].component.name,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: policyAlertsModel[1].component.name,
          status: policyAlertsModel[1].alertInfo.status,
          link:
            resultLinkTemplate + `uuid=${policyAlertsModel[1].component.uuid};`,
          description: policyAlertsModel[1].component.description,
        },
      })

      expect(spyResult).toHaveBeenNthCalledWith(3, {
        criterion: 'Open Security Alert Mend',
        justification: securityAlertsModel[0].vulnerability.name,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: `${securityAlertsModel[0].vulnerability.name}:${securityAlertsModel[0].component.name}`,
          severity: securityAlertsModel[0].vulnerability.severity,
          score: `${securityAlertsModel[0].vulnerability.score}`,
          status: securityAlertsModel[0].alertInfo.status,
          link:
            resultLinkTemplate +
            `uuid=${securityAlertsModel[0].component.uuid};`,
          description: securityAlertsModel[0].vulnerability.description,
        },
      })
      expect(spyResult).toHaveBeenNthCalledWith(4, {
        criterion: 'Open Security Alert Mend',
        justification: securityAlertsModel[1].vulnerability.name,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: `${securityAlertsModel[1].vulnerability.name}:${securityAlertsModel[1].component.name}`,
          severity: securityAlertsModel[1].vulnerability.severity,
          score: `${securityAlertsModel[1].vulnerability.score}`,
          status: securityAlertsModel[1].alertInfo.status,
          link:
            resultLinkTemplate +
            `uuid=${securityAlertsModel[1].component.uuid};`,
          description: securityAlertsModel[1].vulnerability.description,
        },
      })
      expect(spyResult).toHaveBeenNthCalledWith(5, {
        criterion: 'New Versions Alert Mend',
        justification:
          newVersionsAlertsModel[0].component.name +
          ':' +
          newVersionsAlertsModel[0].availableVersionType +
          ' ' +
          newVersionsAlertsModel[0].availableVersion,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: newVersionsAlertsModel[0].component.name,
          status: newVersionsAlertsModel[0].alertInfo.status,
          link:
            resultLinkTemplate +
            `uuid=${newVersionsAlertsModel[0].component.uuid};`,
          description: newVersionsAlertsModel[0].component.description,
        },
      })
      expect(spyResult).toHaveBeenNthCalledWith(6, {
        criterion: 'New Versions Alert Mend',
        justification:
          newVersionsAlertsModel[1].component.name +
          ':' +
          newVersionsAlertsModel[1].availableVersionType +
          ' ' +
          newVersionsAlertsModel[1].availableVersion,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: newVersionsAlertsModel[1].component.name,
          status: newVersionsAlertsModel[1].alertInfo.status,
          link:
            resultLinkTemplate +
            `uuid=${newVersionsAlertsModel[1].component.uuid};`,
          description: newVersionsAlertsModel[1].component.description,
        },
      })

      expect(spyResult).toHaveBeenNthCalledWith(7, {
        criterion: 'Multiple Licenses Alert Mend',
        justification:
          multipleLicensesAlertsModel[0].component.name +
          ':' +
          multipleLicensesAlertsModel[0].numberOfLicenses +
          ' ' +
          multipleLicensesAlertsModel[0].licenses,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: multipleLicensesAlertsModel[0].component.name,
          status: multipleLicensesAlertsModel[0].alertInfo.status,
          link:
            resultLinkTemplate +
            `uuid=${multipleLicensesAlertsModel[0].component.uuid};`,
          description: multipleLicensesAlertsModel[0].component.description,
        },
      })
      expect(spyResult).toHaveBeenNthCalledWith(8, {
        criterion: 'Multiple Licenses Alert Mend',
        justification:
          multipleLicensesAlertsModel[1].component.name +
          ':' +
          multipleLicensesAlertsModel[1].numberOfLicenses +
          ' ' +
          multipleLicensesAlertsModel[1].licenses,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: multipleLicensesAlertsModel[1].component.name,
          status: multipleLicensesAlertsModel[1].alertInfo.status,
          link:
            resultLinkTemplate +
            `uuid=${multipleLicensesAlertsModel[1].component.uuid};`,
          description: multipleLicensesAlertsModel[1].component.description,
        },
      })
      expect(spyResult).toHaveBeenNthCalledWith(9, {
        criterion: 'Rejected In Use Alert Mend',
        justification:
          rejectedInUseAlertsModel[0].component.name +
          ':' +
          rejectedInUseAlertsModel[0].description,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: rejectedInUseAlertsModel[0].component.name,
          status: rejectedInUseAlertsModel[0].alertInfo.status,
          link:
            resultLinkTemplate +
            `uuid=${rejectedInUseAlertsModel[0].component.uuid};`,
          description: rejectedInUseAlertsModel[0].component.description,
        },
      })
      expect(spyResult).toHaveBeenNthCalledWith(10, {
        criterion: 'Rejected In Use Alert Mend',
        justification:
          rejectedInUseAlertsModel[1].component.name +
          ':' +
          rejectedInUseAlertsModel[1].description,
        fulfilled: false,
        metadata: {
          project: projectModel.name,
          name: rejectedInUseAlertsModel[1].component.name,
          status: rejectedInUseAlertsModel[1].alertInfo.status,
          link:
            resultLinkTemplate +
            `uuid=${rejectedInUseAlertsModel[1].component.uuid};`,
          description: rejectedInUseAlertsModel[1].component.description,
        },
      })
      expect(spyStatus).toHaveBeenCalledWith('RED')
      expect(spyReason).toHaveBeenCalledWith(
        `${
          policyAlertsModel.length +
          securityAlertsModel.length +
          newVersionsAlertsModel.length +
          multipleLicensesAlertsModel.length +
          rejectedInUseAlertsModel.length
        } alerts were found, last scan was executed on ${
          projectVitalsModel.lastScan
        }` +
          `, see more details in Mend ` +
          reasonLinkTemplate +
          `${
            envVariable.value === undefined
              ? ` in project ` + projectModel.name
              : ``
          }` +
          `;`
      )
    })
  })

  describe.each([
    { name: 'MEND_PROJECT_ID', value: '123321' },
    { name: 'MEND_PROJECT_ID', value: undefined },
  ])('Expected GREEN status', (envVariable) => {
    beforeEach(() => {
      vi.stubEnv('MEND_API_URL', 'https://foo.bar')
      vi.stubEnv('MEND_SERVER_URL', 'https://bar.foo')
      vi.stubEnv('MEND_ORG_TOKEN', 'dummy2-token')
      if (envVariable.value) {
        vi.stubEnv(envVariable.name, envVariable.value)
      }
      vi.stubEnv('MEND_PROJECT_TOKEN', 'dummy3-token')
      vi.stubEnv('MEND_USER_EMAIL', 'dummy1@some.gTLD')
      vi.stubEnv('MEND_USER_KEY', 'dummy1-userkey')
      vi.stubEnv('MEND_REPORT_TYPE', 'vulnerabilities')
      vi.stubEnv('MEND_ALERTS_STATUS', 'active')
      vi.stubEnv('MEND_MIN_CONNECTION_TIME', '123')
      vi.stubEnv('MEND_MAX_CONCURRENT_CONNECTIONS', '321')
      vi.stubEnv('MEND_RESULTS_PATH', 'dummy4-path')
    })

    it('should set GREEN status when no vulnerabilities are found', async () => {
      if (!envVariable.value) {
        delete process.env[`${envVariable.name}`]
      }
      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )
      const spyResult = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'addResult'
      )
      const spyOrganizationService = vi.spyOn(
        OrganizationService.prototype,
        'getOrganizationById'
      )
      spyOrganizationService.mockReturnValueOnce(
        Promise.resolve(organizationModel)
      )
      const spyProjectService = vi.spyOn(
        ProjectService.prototype,
        'getProjectByToken'
      )
      spyProjectService.mockReturnValueOnce(Promise.resolve(projectModel))
      const spyVitalsProjectService = vi.spyOn(
        ProjectService.prototype,
        'getProjectVitals'
      )
      spyVitalsProjectService.mockReturnValueOnce(
        Promise.resolve(projectVitalsModel)
      )
      const spyLibraryService = vi.spyOn(
        LibraryService.prototype,
        'getAllLibrariesById'
      )
      spyLibraryService.mockReturnValueOnce(Promise.resolve(librariesModel))
      const spyVulnerabilityService = vi.spyOn(
        VulnerabilityService.prototype,
        'getAllVulnerabilitiesById'
      )

      spyVulnerabilityService.mockReturnValueOnce(Promise.resolve([]))
      spyVulnerabilityService.mockReturnValueOnce(Promise.resolve([]))

      const reasonLinkTemplate =
        envVariable.value !== undefined
          ? `${process.env.MEND_SERVER_URL}/Wss/WSS.html#!project;` +
            `orgToken=${organizationModel.uuid};` +
            `id=${process.env.MEND_PROJECT_ID}`
          : `${process.env.MEND_SERVER_URL}/Wss/WSS.html` +
            ` in organization ${organizationModel.name}` +
            ` and project ${projectModel.name}`

      expect.assertions(3)
      await run()

      expect(spyResult).toHaveBeenNthCalledWith(1, {
        criterion: 'There are no open vulnerabilities in mend',
        justification: 'No open vulnerabilities were found',
        fulfilled: true,
        metadata: {},
      })
      expect(spyStatus).toHaveBeenCalledWith('GREEN')
      expect(spyReason).toHaveBeenCalledWith(
        `No vulnerabilities were found, last scan was executed on ${projectVitalsModel.lastScan}` +
          ',' +
          ' see more details in Mend ' +
          reasonLinkTemplate +
          ';'
      )
    })

    it('should set GREEN status when no alerts are found', async () => {
      if (!envVariable.value) {
        delete process.env[`${envVariable.name}`]
      }
      vi.stubEnv('MEND_REPORT_TYPE', 'alerts')
      const spyStatus = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setStatus'
      )
      const spyReason = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'setReason'
      )
      const spyResult = vi.spyOn(
        autopilotUtils.AppOutput.prototype,
        'addResult'
      )
      const spyOrganizationService = vi.spyOn(
        OrganizationService.prototype,
        'getOrganizationById'
      )
      spyOrganizationService.mockReturnValueOnce(
        Promise.resolve(organizationModel)
      )
      const spyProjectService = vi.spyOn(
        ProjectService.prototype,
        'getProjectByToken'
      )
      spyProjectService.mockReturnValueOnce(Promise.resolve(projectModel))
      const spyPolicyAlertService = vi.spyOn(
        AlertService.prototype,
        'getPolicyAlertsById'
      )
      const spyNewVersionAlertService = vi.spyOn(
        AlertService.prototype,
        'getNewVersionsAlertsById'
      )
      const spyMultipleLicensesAlertService = vi.spyOn(
        AlertService.prototype,
        'getMultipleLicensesAlertsById'
      )
      const spyRejectedInUseAlertService = vi.spyOn(
        AlertService.prototype,
        'getRejectedInUseAlertsById'
      )
      const spyVitalsProjectService = vi.spyOn(
        ProjectService.prototype,
        'getProjectVitals'
      )
      spyVitalsProjectService.mockReturnValueOnce(
        Promise.resolve(projectVitalsModel)
      )
      spyPolicyAlertService.mockReturnValueOnce(Promise.resolve([]))
      spyNewVersionAlertService.mockReturnValueOnce(Promise.resolve([]))
      spyMultipleLicensesAlertService.mockReturnValueOnce(Promise.resolve([]))
      spyRejectedInUseAlertService.mockReturnValueOnce(Promise.resolve([]))
      const spySecurityAlertService = vi.spyOn(
        AlertService.prototype,
        'getSecurityAlertsById'
      )
      spySecurityAlertService.mockReturnValueOnce(Promise.resolve([]))
      const reasonLinkTemplate =
        envVariable.value !== undefined
          ? `${process.env.MEND_SERVER_URL}/Wss/WSS.html#!project;` +
            `orgToken=${organizationModel.uuid};` +
            `id=${process.env.MEND_PROJECT_ID}`
          : `${process.env.MEND_SERVER_URL}/Wss/WSS.html` +
            ` in organization ${organizationModel.name}` +
            ` and project ${projectModel.name}`

      expect.assertions(3)
      await run()

      expect(spyResult).toHaveBeenNthCalledWith(1, {
        criterion: 'There are no open alerts in mend',
        justification: 'No open alerts were found',
        fulfilled: true,
        metadata: {},
      })

      expect(spyStatus).toHaveBeenCalledWith('GREEN')
      expect(spyReason).toHaveBeenCalledWith(
        `No alerts were found, last scan was executed on ${projectVitalsModel.lastScan}` +
          `,` +
          ` see more details in Mend ` +
          reasonLinkTemplate +
          `;`
      )
    })
  })

  describe('Unexpected app exit', () => {
    beforeEach(() => {
      vi.stubEnv('MEND_API_URL', 'https://foo.bar')
      vi.stubEnv('MEND_SERVER_URL', 'https://bar.foo')
      vi.stubEnv('MEND_ORG_TOKEN', 'dummy2-token')
      vi.stubEnv('MEND_RPOJECT_ID', '123321')
      vi.stubEnv('MEND_PROJECT_TOKEN', 'dummy3-token')
      vi.stubEnv('MEND_USER_EMAIL', 'dummy1@some.gTLD')
      vi.stubEnv('MEND_USER_KEY', 'dummy1-userkey')
      vi.stubEnv('MEND_REPORT_TYPE', 'vulnerabilities')
      vi.stubEnv('MEND_ALERTS_STATUS', 'active')
      vi.stubEnv('MEND_MIN_CONNECTION_TIME', '123')
      vi.stubEnv('MEND_MAX_CONCURRENT_CONNECTIONS', '321')
      vi.stubEnv('MEND_RESULTS_PATH', 'dummy4-path')
    })

    it('should throw an error when unexpected ', async () => {
      const spyOrg = vi.spyOn(
        OrganizationService.prototype,
        'getOrganizationById'
      )
      spyOrg.mockRejectedValueOnce(new Error())

      expect.assertions(1)
      const result = run()

      await expect(result).rejects.toThrowError()
    })
  })
})
