// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { AppOutput, GetLogger } from '@B-S-F/autopilot-utils'
import { writeFile } from 'fs/promises'
import { fetch, EnvHttpProxyAgent } from 'undici'
import {
  createApiUrl,
  createAuthHeader,
  createDashboardUrl,
} from './create-url.js'
import { RequestError } from './errors.js'
import { FetchOptions } from './index.js'

const PROJECT_STATUS_API_PATH = 'api/qualitygates/project_status'

export type FetchProjectStatusOptions = {
  projectKey: string
}

export async function projectStatus(
  options: FetchOptions & FetchProjectStatusOptions,
): Promise<void> {
  const logger = GetLogger()
  logger.info(`Fetching project status for ${options.projectKey}`)
  const dashboardUrl = createDashboardUrl(
    options.hostname,
    options.port,
    options.protocol,
    options.projectKey,
  )
  logger.debug(`dashboardUrl url: ${dashboardUrl.href}`)

  let proxyTunnel = undefined
  if (options.enableProxy) {
    logger.info('Configuring proxy tunnel')
    const httpProxy = process.env.HTTPS_PROXY
    const httpsProxy = process.env.HTTP_PROXY
    logger.debug(`httpProxy: ${httpProxy}`)
    logger.debug(`httpsProxy: ${httpsProxy}`)
    proxyTunnel = new EnvHttpProxyAgent()
  }

  const projectStatus = await getProjectStatus(
    options.hostname,
    options.port,
    options.protocol,
    options.projectKey,
    options.accessToken,
    proxyTunnel,
  )

  logger.info(`Writing response to ${options.outputPath}`)
  await writeFile(options.outputPath, JSON.stringify(projectStatus, null, 2))

  const result = new AppOutput()
  result.addOutput({
    dashboardUrl: dashboardUrl.href,
    sonarqubeResultPath: options.outputPath,
  })
  result.write()
}

type ProjectStatus = {
  status: string
  ignoredConditions: boolean
  conditions: Array<{
    status: string
    metricKey: string
    comparator: string
    errorThreshold: string
    actualValue: string
  }>
  period: {
    mode: string
    date: string
    parameter: string
  }
}

export async function getProjectStatus(
  hostname: string,
  port: number,
  protocol: 'http' | 'https',
  projectKey: string,
  accessToken: string,
  proxyTunnel?: EnvHttpProxyAgent,
): Promise<ProjectStatus> {
  const logger = GetLogger()
  const apiUrl = createApiUrl(
    hostname,
    port,
    protocol,
    PROJECT_STATUS_API_PATH,
    { projectKey: projectKey },
  )
  logger.debug(`apiUrl: ${apiUrl.href}`)
  const response = await fetch(apiUrl.href, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: createAuthHeader(accessToken),
    },
    dispatcher: proxyTunnel,
  })

  const text = await response.text()
  if (!response.ok) {
    throw new RequestError(
      `Failed to fetch project status with status ${response.status}, ${text}`,
    )
  }

  try {
    return JSON.parse(text)
  } catch (error: any) {
    throw new Error(
      `Could not parse sonarqube response as JSON, ${error.message}`,
    )
  }
}
