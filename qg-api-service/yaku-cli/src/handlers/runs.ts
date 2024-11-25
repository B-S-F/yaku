// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Command } from 'commander'
import { ApiClient, QueryOptions, Run } from '@B-S-F/yaku-client-lib'
import {
  handleStandardParams,
  logDownloadedFile,
  logResultAsJson,
  logSuccess,
  parseFilterOption,
  parseIntParameter,
} from '../common.js'

export async function listRuns(
  client: ApiClient,
  namespace: number | undefined,
  page: string,
  options: any,
) {
  handleStandardParams(client, namespace)
  const pg = page ? parseIntParameter(page, 'page') : 1
  const ic = options.itemCount
    ? parseIntParameter(options.itemCount, 'itemCount')
    : 20

  const filterOption = parseFilterOption(options.filterBy)
  const filterProperty: string[] = []
  const filterValues: string[][] = []
  if (filterOption.filterProperty) {
    filterProperty.push(filterOption.filterProperty)
    filterValues.push(filterOption.filterValues!)
  }
  if (options.latestOnly) {
    filterProperty.push('latestOnly')
    filterValues.push(['true'])
  }
  const queryOptions = new QueryOptions(
    pg,
    ic,
    filterProperty,
    filterValues,
    options.sortBy,
    options.ascending,
  )
  if (options.all) {
    await logResultAsJson(client!.listAllRuns(namespace!, queryOptions))
  } else {
    await logResultAsJson(client!.listRuns(namespace!, queryOptions))
  }
}

export async function showRun(
  client: ApiClient,
  namespace: number | undefined,
  runId: string,
  options: any,
) {
  const rn = handleStandardParams(client, namespace, runId, 'runId')
  await logResultAsJson(
    client!.getRun(namespace!, rn, Boolean(options.details)),
  )
}

export function getRunEnvironment(
  program: Command,
  options: any,
): { [key: string]: string } {
  const environment: { [key: string]: string } = {}
  if (options.environment != null) {
    if (options.environment.length % 2 != 0) {
      program.error(
        'Error: You provided additional environment variables but in the wrong format. Correct: KEY1 VALUE1 KEY2 VALUE2 ...',
        { exitCode: 1 },
      )
    }

    for (let i = 0; i < options.environment.length; i += 2) {
      const key: string = options.environment[i]
      if (key.length == 0) {
        program.error(
          'Error: You provided an environment variable with an empty key',
          { exitCode: 1 },
        )
      }
      environment[key] = options.environment[i + 1]
    }
  }
  return environment
}

export async function createRun(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
  options: any,
  environment: { [key: string]: string },
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')
  let result: Run
  if (options.wait) {
    const pollInterval = parseIntParameter(
      options.pollInterval,
      'poll-interval',
    )
    result = await client!.startAndAwaitRun(
      namespace!,
      cf,
      environment,
      pollInterval * 1000,
    )
  } else {
    result = await client!.startRun(namespace!, cf, environment)
  }
  if (!options.details) {
    delete result.argoName
    delete result.argoNamespace
    delete result.log
  }
  await logResultAsJson(Promise.resolve(result))
}

export async function getRunResult(
  client: ApiClient,
  namespace: number | undefined,
  runId: string,
) {
  const rn = handleStandardParams(client, namespace, runId, 'runId')
  await logDownloadedFile(client!.getRunResult(namespace!, rn))
}

export async function getRunEvidences(
  client: ApiClient,
  namespace: number | undefined,
  runId: string,
) {
  const rn = handleStandardParams(client, namespace, runId, 'runId')
  await logDownloadedFile(client!.getRunEvidences(namespace!, rn))
}

export async function deleteRun(
  client: ApiClient,
  namespace: number | undefined,
  runId: string,
) {
  const rn = handleStandardParams(client, namespace, runId, 'runId')
  await logSuccess(
    client!.deleteRun(namespace!, rn),
    `Run with id ${runId} was successfully deleted`,
  )
}
