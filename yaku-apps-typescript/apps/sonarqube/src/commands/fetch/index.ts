// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { InitLogger } from '@B-S-F/autopilot-utils'
import { Command } from 'commander'
import { ConfigurationError } from './errors.js'
import { projectStatus } from './project-status.js'

export type FetchOptions = {
  hostname: string
  port: number
  accessToken: string
  protocol: 'https' | 'http'
  outputPath: string
  enableProxy: boolean
}

export function addFetchOptions(command: Command) {
  command
    .option(
      '--hostname <hostname>',
      'Sonarqube hostname e.g. "sonarqube.bosch.com"',
      process.env.SONARQUBE_HOSTNAME,
    )
    .option(
      '--access-token <access-token>',
      'Sonarqube access token',
      process.env.SONARQUBE_ACCESS_TOKEN,
    )
    .option(
      '--port [port]',
      'Sonarqube port',
      process.env.SONARQUBE_PORT ?? '443',
    )
    .option(
      '--protocol [protocol]',
      'Sonarqube protocol ("https", "http")',
      process.env.SONARQUBE_PROTOCOL ?? 'https',
    )
    .option(
      '--output-path [output-path]',
      'File to write the fetched data to',
      process.env.SONARQUBE_OUTPUT_PATH ?? 'sonarqube_data.json',
    )
    .option('--debug', 'Enable debug logging', process.env.DEBUG ?? false)
    .option('--enable-proxy', 'Enable proxy', process.env.ENABLE_PROXY ?? false)
}

export function verifyOptions(options: any): options is FetchOptions {
  if (options.debug) {
    InitLogger('sonarqube', 'debug')
  } else {
    InitLogger('sonarqube', 'info')
  }
  const environmentErrors = []
  if (!options.hostname) {
    environmentErrors.push(new ConfigurationError('hostname is not set'))
  }

  if (!options.accessToken) {
    environmentErrors.push(new ConfigurationError('access token is not set'))
  }
  if (Number(options.port) < 1 || Number(options.port) > 65535) {
    environmentErrors.push(
      new ConfigurationError(
        `port ${options.port} is not set to a valid port number`,
      ),
    )
  }
  if (options.protocol !== 'http' && options.protocol !== 'https') {
    environmentErrors.push(
      new ConfigurationError('protocol not set to http or https'),
    )
  }
  if (!options.outputPath) {
    environmentErrors.push(new ConfigurationError('output path is not set'))
  }
  if (environmentErrors.length > 0) {
    const concatenatedReasons = environmentErrors
      .map((error) => error.Reason())
      .join('\n')
    throw new ConfigurationError(concatenatedReasons)
  }
  return true
}

const projectStatusCommand = new Command('project-status')
  .description('Fetch project status from Sonarqube.')
  .option(
    '--project-key <project-key>',
    'Sonarqube project key',
    process.env.SONARQUBE_PROJECT_KEY,
  )
  .action(async (options: any) => {
    verifyOptions(options)
    if (!options.projectKey) {
      throw new ConfigurationError('project key  is not set')
    }
    await projectStatus(options)
  })

addFetchOptions(projectStatusCommand)

export const command = new Command('fetch')
  .description('Fetch data from Sonarqube.')
  .addCommand(projectStatusCommand)
