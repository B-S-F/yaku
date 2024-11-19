// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MendEnvironment } from './model/mendEnvironment.js'
import { Library } from './model/library.js'
import { LibraryService } from './service/library.service.js'
import { Organization } from './model/organization.js'
import { OrganizationService } from './service/organization.service.js'
import { Project } from './model/project.js'
import { ProjectService } from './service/project.service.js'
import { ProjectVitals } from './model/projectVitals.js'
import { VulnerabilityService } from './service/vulnerability.service.js'
import { Vulnerability } from './model/vulnerability.js'
import { AlertService } from './service/alert.service.js'
import { PolicyAlert } from './model/policyAlert.js'
import { SecurityAlert } from './model/securityAlert.js'
import { exportJson } from './utils/export.js'
import { AppError, AppOutput, InitLogger } from '@B-S-F/autopilot-utils'
import Bottleneck from 'bottleneck'
import path from 'path'
import z, { ZodError } from 'zod'
import { NewVersionsAlert } from './model/newVersionsAlert.js'
import { MultipleLicensesAlert } from './model/multipleLicensesAlert.js'
import { RejectedInUseAlert } from './model/rejectedInUseAlert.js'
import { VulnerabilityFixSummary } from './model/vulnerabilityFixSummary.js'

const customZodErrorMap: z.ZodErrorMap = (error, ctx) => {
  switch (error.code) {
    case z.ZodIssueCode.invalid_type:
      if (error.expected === 'number' && error.received === 'nan') {
        return { message: 'Expected number, received not a number' }
      }
      break
  }

  return { message: ctx.defaultError }
}

const checkdelimiter = (
  value: string | undefined,
  context: z.RefinementCtx
) => {
  if (value != undefined) {
    if (value.endsWith(',')) {
      const customError: z.ZodIssue = {
        message: 'Unexpected trailing comma',
        code: 'custom',
        path: context.path,
      }
      throw new ZodError([customError])
    }
  }
}

const validProjectIDs = (value: string | undefined) => {
  if (value)
    value.split(',').forEach((id: string) => {
      if (isNaN(Number(id))) {
        const customError: z.ZodIssue = {
          code: 'custom',
          message: 'Must be a number or numbers splitted by a comma.',
          path: ['MEND_PROJECT_ID'],
        }
        throw new ZodError([customError])
      }
    })
}

const validProjectTokens = (value: string) => {
  value.split(',').forEach((token) => {
    if (token.length == 0) {
      const customError: z.ZodIssue = {
        code: 'custom',
        message: 'String must contain at least 1 character(s)',
        path: ['MEND_PROJECT_TOKEN'],
      }
      throw new ZodError([customError])
    }
  })
}

const toProjectIDArray = (value: string | undefined) => {
  const prjIdArray = value
    ? value.split(',').map((id: string) => {
        return id.length == 0 ? undefined : Number(id)
      })
    : []
  return prjIdArray
}

const toProjectTokenArray = (value: string) => {
  return value.split(',')
}

const validateAndCreateProjectIDTokenMap = (
  prjIDs: (number | undefined)[],
  prjTokens: string[]
) => {
  if (prjIDs.length !== prjTokens.length && prjIDs.length !== 0) {
    const customError: z.ZodIssue = {
      code: 'custom',
      message:
        'and MEND_PROJECT_ID should be of equal length or MEND_PROJECT_ID should be empty.',
      path: ['MEND_PROJECT_TOKEN'],
    }
    throw new ZodError([customError])
  }

  const map: any[] = []
  prjTokens.forEach((token, index) => {
    return map.push({
      token,
      id: index < prjIDs.length ? prjIDs[index] : undefined,
    })
  })

  return map as { token: string; id: number | undefined }[]
}

const validateEnvironmentVariables = () => {
  const envSchema = z.object({
    MEND_API_URL: z.string().url(),
    MEND_SERVER_URL: z.string().url(),
    MEND_ORG_TOKEN: z.string().min(1),
    MEND_PROJECT_TOKEN: z.string().min(1),
    MEND_USER_EMAIL: z.string().email(),
    MEND_USER_KEY: z.string().min(1),
    MEND_REPORT_TYPE: z
      .enum(['alerts', 'vulnerabilities'])
      .default('vulnerabilities'),
    MEND_ALERTS_STATUS: z
      .enum([
        'all',
        'active',
        'ignored',
        'library_removed',
        'library_in_house',
        'library_whitelist',
      ])
      .default('active'),
    MEND_MIN_CONNECTION_TIME: z.coerce.number().default(50),
    MEND_MAX_CONCURRENT_CONNECTIONS: z.coerce.number().default(50),
    MEND_RESULTS_PATH: z.string().default('./'),
  })

  const projectsSchema = z.object({
    MEND_PROJECT_ID: z
      .string()
      .optional()
      .superRefine(validProjectIDs)
      .transform(toProjectIDArray),
    MEND_PROJECT_TOKEN: z
      .string()
      .min(1)
      .superRefine(checkdelimiter)
      .superRefine(validProjectTokens)
      .transform(toProjectTokenArray),
  })

  const validatedENV = envSchema.parse(process.env, {
    errorMap: customZodErrorMap,
  })
  const validatedProjects = projectsSchema.parse(process.env, {
    errorMap: customZodErrorMap,
  })
  const projectsIDTokenMap = validateAndCreateProjectIDTokenMap(
    validatedProjects.MEND_PROJECT_ID,
    validatedProjects.MEND_PROJECT_TOKEN
  )

  const parsedENV = {
    ...validatedENV,
    MEND_PROJECT_IDS_TOKENS_MAP: projectsIDTokenMap,
  }

  return parsedENV
}

export const run = async () => {
  const logger = InitLogger('mend-fetcher', 'info')
  let localOutput: AppOutput
  const globalOutput = new AppOutput()
  globalOutput.setStatus('GREEN')

  try {
    const validatedEnvironment = validateEnvironmentVariables()

    const limiter = new Bottleneck({
      minTime: validatedEnvironment.MEND_MIN_CONNECTION_TIME,
      maxConcurrent: validatedEnvironment.MEND_MAX_CONCURRENT_CONNECTIONS,
    })

    for (const {
      token: MEND_PROJECT_TOKEN,
      id: MEND_PROJECT_ID,
    } of validatedEnvironment.MEND_PROJECT_IDS_TOKENS_MAP) {
      const env: MendEnvironment = {
        alertsStatus: validatedEnvironment.MEND_ALERTS_STATUS,
        apiUrl: validatedEnvironment.MEND_API_URL,
        serverUrl: validatedEnvironment.MEND_SERVER_URL,
        email: validatedEnvironment.MEND_USER_EMAIL,
        maxConcurrentConnections:
          validatedEnvironment.MEND_MAX_CONCURRENT_CONNECTIONS,
        minConnectionTime: validatedEnvironment.MEND_MIN_CONNECTION_TIME,
        orgToken: validatedEnvironment.MEND_ORG_TOKEN,
        projectId: MEND_PROJECT_ID,
        projectToken: MEND_PROJECT_TOKEN,
        reportType: validatedEnvironment.MEND_REPORT_TYPE,
        resultsPath: validatedEnvironment.MEND_RESULTS_PATH,
        userKey: validatedEnvironment.MEND_USER_KEY,
      }

      localOutput = new AppOutput()

      const orgService = new OrganizationService(env)
      const organization: Organization = await limiter.schedule(() =>
        orgService.getOrganizationById(env.orgToken)
      )
      const projectService = new ProjectService(env)
      const project: Project = await limiter.schedule(() =>
        projectService.getProjectByToken(env.projectToken)
      )
      const projectVitals: ProjectVitals = await limiter.schedule(() =>
        projectService.getProjectVitals(project.uuid)
      )

      const resultLinkTemplate =
        env.projectId !== undefined
          ? `${env.serverUrl}/Wss/WSS.html#!libraryDetails;` +
            `orgToken=${organization.uuid};` +
            `project=${env.projectId};`
          : `${env.serverUrl}/Wss/WSS.html#!libraryDetails;` +
            `orgToken=${organization.uuid};`
      const reasonDetailsTemplate =
        env.projectId !== undefined
          ? `see more details in Mend ` +
            `${env.serverUrl}/Wss/WSS.html#!project;` +
            `orgToken=${organization.uuid};` +
            `id=${env.projectId}`
          : `see more details in Mend ` +
            `${env.serverUrl}/Wss/WSS.html` +
            ` in organization ${organization.name}` +
            ` and project ${project.name}`

      logger.info(
        `----- Project '${project.name}' with uuid '${project.uuid}' from '${project.productName}' -----`
      )

      if (env.reportType === 'alerts') {
        const alertService: AlertService = new AlertService(env)
        const policyAlerts = await limiter.schedule(() =>
          alertService.getPolicyAlertsById(project.uuid, env.alertsStatus)
        )
        logger.info('----- Policy Alerts -----')
        policyAlerts.map((alert: PolicyAlert) => {
          localOutput.addResult({
            criterion: 'Open Policy Alert Mend',
            justification: alert.component.name,
            fulfilled: false,
            metadata: {
              project: project.name,
              name: alert.component.name,
              status: alert.alertInfo.status,
              link: `${resultLinkTemplate}uuid=${alert.component.uuid};`,
              description: alert.component.description,
            },
          })
        })
        logger.info('---------------------------')

        const securityAlerts = await limiter.schedule(() =>
          alertService.getSecurityAlertsById(project.uuid, env.alertsStatus)
        )
        logger.info('----- Security Alerts -----')
        securityAlerts.map((alert: SecurityAlert) => {
          logger.info(
            `${alert.name} ` +
              `${alert.vulnerability.severity} ` +
              `${alert.vulnerability.score} ` +
              `${alert.alertInfo.status} ` +
              `: ` +
              `${alert.component.name} ` +
              `${alert.topFix.message} ` +
              `${alert.topFix.fixResolution}`
          )
          localOutput.addResult({
            criterion: 'Open Security Alert Mend',
            justification: alert.vulnerability.name,
            fulfilled: false,
            metadata: {
              project: project.name,
              name: `${alert.vulnerability.name}:${alert.component.name}`,
              severity: alert.vulnerability.severity,
              score: `${alert.vulnerability.score}`,
              status: alert.alertInfo.status,
              link: `${resultLinkTemplate}uuid=${alert.component.uuid};`,
              description: alert.vulnerability.description,
            },
          })
        })
        logger.info('---------------------------')

        const newVersionsAlerts = await limiter.schedule(() =>
          alertService.getNewVersionsAlertsById(project.uuid, env.alertsStatus)
        )
        logger.info('----- New Versions Alerts -----')
        newVersionsAlerts.map((alert: NewVersionsAlert) => {
          logger.info(
            `${alert.name} ` +
              `${alert.alertInfo.status} ` +
              `: ` +
              `${alert.component.name}`
          )
          localOutput.addResult({
            criterion: 'New Versions Alert Mend',
            justification:
              alert.component.name +
              ':' +
              alert.availableVersionType +
              ' ' +
              alert.availableVersion,
            fulfilled: false,
            metadata: {
              project: project.name,
              name: alert.component.name,
              status: alert.alertInfo.status,
              link: `${resultLinkTemplate}uuid=${alert.component.uuid};`,
              description: alert.component.description,
            },
          })
        })

        logger.info('---------------------------')
        const multipleLicensesAlerts = await limiter.schedule(() =>
          alertService.getMultipleLicensesAlertsById(
            project.uuid,
            env.alertsStatus
          )
        )

        logger.info('----- Multiple Licenses Alerts -----')
        multipleLicensesAlerts.map((alert: MultipleLicensesAlert) => {
          logger.info(
            `${alert.name} ` +
              `${alert.licenses} ` +
              `${alert.alertInfo.status} ` +
              `: ` +
              `${alert.component.name}`
          )
          localOutput.addResult({
            criterion: 'Multiple Licenses Alert Mend',
            justification:
              alert.component.name +
              ':' +
              alert.numberOfLicenses +
              ' ' +
              alert.licenses,
            fulfilled: false,
            metadata: {
              project: project.name,
              name: alert.component.name,
              status: alert.alertInfo.status,
              link: `${resultLinkTemplate}uuid=${alert.component.uuid};`,
              description: alert.component.description,
            },
          })
        })

        logger.info('---------------------------')
        const rejectedInUseAlerts = await limiter.schedule(() =>
          alertService.getRejectedInUseAlertsById(
            project.uuid,
            env.alertsStatus
          )
        )
        logger.info('----- Rejected in Use Alerts -----')
        rejectedInUseAlerts.map((alert: RejectedInUseAlert) => {
          logger.info(
            `${alert.name} ` +
              `${alert.alertInfo.status} ` +
              `: ` +
              `${alert.component.name}`
          )
          localOutput.addResult({
            criterion: 'Rejected In Use Alert Mend',
            justification: alert.component.name + ':' + alert.description,
            fulfilled: false,
            metadata: {
              project: project.name,
              name: alert.component.name,
              status: alert.alertInfo.status,
              link: `${resultLinkTemplate}uuid=${alert.component.uuid};`,
              description: alert.component.description,
            },
          })
        })
        logger.info('---------------------------')
      } else if (env.reportType === 'vulnerabilities') {
        logger.info('----- Vulnerabilities -----')

        const libraryService: LibraryService = new LibraryService(env)
        const vulnerabilityService: VulnerabilityService =
          new VulnerabilityService(env)
        const vulnerableLibraries = new Map<Library, Vulnerability[]>()
        const vulnerabilityFixes = new Map<
          Vulnerability,
          VulnerabilityFixSummary
        >()

        await Promise.all(
          (
            await limiter.schedule(() =>
              libraryService.getAllLibrariesById(project.uuid)
            )
          ).map(async (library: Library) => {
            const vulns = await limiter.schedule(() =>
              vulnerabilityService.getAllVulnerabilitiesById(
                library.uuid,
                project.uuid
              )
            )

            let fix: VulnerabilityFixSummary
            for (const vuln of vulns) {
              fix = await limiter.schedule(() =>
                vulnerabilityService.getAllVulnerabilitiesFixSummaryById(
                  vuln.name
                )
              )
              vulnerabilityFixes.set(vuln, fix)
            }

            vulnerableLibraries.set(library, vulns)
          })
        )

        for (const lib of vulnerableLibraries.keys()) {
          vulnerableLibraries.get(lib)?.map((vuln: Vulnerability) => {
            logger.info(
              `${vuln.name} ${vuln.severity} ${vuln.score} : ${lib.name}`
            )

            const topFix = vulnerabilityFixes.get(vuln)
            const topFixFields = topFix?.topRankedFix
            const message = topFixFields?.message
            const fixResolution = topFixFields?.fixResolution

            localOutput.addResult({
              criterion: 'Open Vulnerability Mend',
              justification: vuln.description,
              fulfilled: false,
              metadata: {
                project: project.name,
                name: `${vuln.name}:${lib.name}`,
                severity: vuln.severity,
                score: `${vuln.score}`,
                link: `${resultLinkTemplate}uuid=${lib.uuid};`,
                description: vuln.description,
                topFix: `${message} ${fixResolution}`,
              },
            })
          })
        }
        logger.info('---------------------------')
      }

      let reason: string

      if (localOutput.data.results.length > 0) {
        globalOutput.setStatus('RED')
        reason =
          `${localOutput.data.results.length} ${env.reportType} were found, last scan was executed on ${projectVitals.lastScan}` +
          ', ' +
          reasonDetailsTemplate +
          ';'
      } else {
        localOutput.addResult({
          criterion: `There are no open ${env.reportType} in mend`,
          justification: `No open ${env.reportType} were found`,
          fulfilled: true,
          metadata: {},
        })
        reason =
          `No ${env.reportType} were found, last scan was executed on ${projectVitals.lastScan}` +
          ', ' +
          reasonDetailsTemplate +
          ';'
      }

      globalOutput.data.results = globalOutput.data.results.concat(
        localOutput.data.results
      )
      globalOutput.setReason(
        globalOutput.data.reason
          ? globalOutput.data.reason.concat(' ' + reason)
          : reason
      )
    }

    const outputJsonPath = path.join(
      validatedEnvironment.MEND_RESULTS_PATH,
      'results.json'
    )
    exportJson(globalOutput.data.results, outputJsonPath)
    globalOutput.write()
  } catch (error: any) {
    console.error(error)
    if (error instanceof ZodError) {
      globalOutput.setStatus('FAILED')
      const reason = `Environment validation failed:${error.issues.map(
        (issue: any) => ` ${issue.path[0]} ${issue.message}`
      )}`
      globalOutput.setReason(
        globalOutput.data.reason
          ? globalOutput.data.reason.concat(reason)
          : reason
      )

      logger.error(
        `Environment validation failed:${error.issues.map(
          (issue: any) => ` ${issue.path[0]} ${issue.message}`
        )}`
      )

      globalOutput.write()
      process.exit(0)
    } else if (error instanceof AppError) {
      globalOutput.setStatus('FAILED')
      globalOutput.setReason(
        globalOutput.data.reason
          ? globalOutput.data.reason.concat(error.Reason())
          : error.Reason()
      )

      logger.error(error.Reason())

      globalOutput.write()
      process.exit(0)
    } else {
      throw error
    }
  }
}
