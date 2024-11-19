import { AppError, AppOutput } from '@B-S-F/autopilot-utils'
import * as fs from 'fs'
import path from 'path'
import * as process from 'process'
import { GitFetcher, GitResource } from './fetchers/index.js'
import generateGitFetcher from './fetchers/generate-git-fetcher.js'
import { ConfigFileData, GitFetcherConfig } from './model/config-file-data.js'
import {
  GitServerConfig,
  supportedAuthMethods,
  supportedGitServerTypes,
} from './model/git-server-config.js'
import { validateFetcherConfig } from './utils/validation.js'

export class EnvironmentError extends AppError {
  constructor(reason: string) {
    super(reason)
    this.name = 'EnvironmentError'
  }

  Reason(): string {
    return super.Reason()
  }
}

export class ConfigurationError extends AppError {
  constructor(reason: string) {
    super(reason)
    this.name = 'ConfigurationError'
  }

  Reason(): string {
    return super.Reason()
  }
}

const exportJsonToEvidenceDirectory = (data: any, filename: string) => {
  const filepath: string = path.join(process.env.evidence_path!, filename)
  fs.writeFileSync(filepath, JSON.stringify(data))
}

function validateEnvironmentVariables() {
  const appErrors: AppError[] = []
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED == '0') {
    appErrors.push(
      new EnvironmentError(
        'NODE_TLS_REJECT_UNAUTHORIZED environment variable is set to 0 which is not allowed',
      ),
    )
  }

  const gitFetcherServerType: string | undefined =
    process.env.GIT_FETCHER_SERVER_TYPE
  if (!gitFetcherServerType) {
    appErrors.push(
      new EnvironmentError(
        'GIT_FETCHER_SERVER_TYPE environment variable is not set',
      ),
    )
  }

  if (!supportedGitServerTypes.includes(gitFetcherServerType as any)) {
    appErrors.push(
      new ConfigurationError(
        `The server type "${process.env.GIT_FETCHER_SERVER_TYPE}" is not supported`,
      ),
    )
  }

  if (!process.env.GIT_FETCHER_SERVER_API_URL) {
    appErrors.push(
      new EnvironmentError(
        'GIT_FETCHER_SERVER_API_URL environment variable is not set.',
      ),
    )
  }

  const httpsRegex = new RegExp(/^https:\/\//)
  if (!process.env.GIT_FETCHER_SERVER_API_URL?.match(httpsRegex)) {
    appErrors.push(
      new ConfigurationError(
        'GIT_FETCHER_SERVER_API_URL environment variable must use secured connections with https',
      ),
    )
  }

  const gitFetcherAuthMethod: string | undefined =
    process.env.GIT_FETCHER_SERVER_AUTH_METHOD
  if (
    (gitFetcherAuthMethod === undefined || gitFetcherAuthMethod === 'token') &&
    !process.env.GIT_FETCHER_API_TOKEN?.trim()
  ) {
    appErrors.push(
      new EnvironmentError(
        'GIT_FETCHER_API_TOKEN environment variable is required for "token" authentication, but is not set or empty.',
      ),
    )
  }

  if (
    gitFetcherAuthMethod !== undefined &&
    !(supportedAuthMethods as unknown as string[]).includes(
      gitFetcherAuthMethod,
    )
  ) {
    appErrors.push(
      new ConfigurationError(
        `No valid authentication method provided. Valid authentication methods are: ${supportedAuthMethods}`,
      ),
    )
  }

  if (
    process.env.GIT_FETCHER_SERVER_AUTH_METHOD == 'basic' &&
    !process.env.GIT_FETCHER_USERNAME?.trim()
  ) {
    appErrors.push(
      new EnvironmentError(
        'GIT_FETCHER_USERNAME environment variable is required for "basic" authentication, but is not set or empty.',
      ),
    )
  }

  if (
    process.env.GIT_FETCHER_SERVER_AUTH_METHOD == 'basic' &&
    !process.env.GIT_FETCHER_PASSWORD?.trim()
  ) {
    appErrors.push(
      new EnvironmentError(
        'GIT_FETCHER_PASSWORD environment variable is required for "basic" authentication, but is not set or empty.',
      ),
    )
  }

  if (appErrors.length > 0) {
    const concatenatedReason = appErrors.map((e) => e.Reason()).join('\n')
    throw new AppError(concatenatedReason)
  }
}

export const run = async (output: AppOutput) => {
  validateEnvironmentVariables()

  const env: GitServerConfig = setupGitServerConfig()

  const fetcherConfigFileData: GitFetcherConfig = await validateFetcherConfig(
    env.gitFetcherConfigFilePath,
  )
  const config: ConfigFileData = new ConfigFileData(fetcherConfigFileData)
  const fetcher: GitFetcher<GitResource> = generateGitFetcher(env, config)
  const fetchedResources = await fetcher.fetchResource()
  if (fetchedResources != undefined) {
    const outputFilePath = env.gitFetcherOutputFilePath || 'data.json'
    exportJsonToEvidenceDirectory(
      fetchedResources,
      env.gitFetcherOutputFilePath || '',
    )
    output.addOutput({
      'git-fetcher-result': outputFilePath,
    })
    console.log(
      `Fetch from ${
        env.gitServerApiUrl
      } was successful with config ${JSON.stringify(config.data)}`,
    )
  }
}

function setupGitServerConfig(): GitServerConfig {
  return {
    gitServerType:
      (process.env
        .GIT_FETCHER_SERVER_TYPE as GitServerConfig['gitServerType']) ?? '',
    gitServerApiUrl: process.env.GIT_FETCHER_SERVER_API_URL ?? '',
    gitServerAuthMethod:
      (process.env
        .GIT_FETCHER_SERVER_AUTH_METHOD as GitServerConfig['gitServerAuthMethod']) ??
      'token',
    gitServerUsername: process.env.GIT_FETCHER_USERNAME ?? '',
    gitServerPassword: process.env.GIT_FETCHER_PASSWORD ?? '',
    gitServerApiToken: process.env.GIT_FETCHER_API_TOKEN ?? '',
    gitFetcherConfigFilePath:
      process.env.GIT_FETCHER_CONFIG_FILE_PATH ?? 'git-fetcher-config.yml',
    gitFetcherOutputFilePath:
      process.env.GIT_FETCHER_OUTPUT_FILE_PATH ?? 'git-fetcher-data.json',
  }
}
