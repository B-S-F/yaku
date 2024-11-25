// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ApiClient, Config, QueryOptions } from '@B-S-F/yaku-client-lib'
import {
  getResourceDeletionConfirmation,
  handleStandardParams,
  logDownloadedFile,
  logResultAsJson,
  logSuccess,
  parseIntParameter,
} from '../common.js'

export async function listConfig(
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
  const queryOptions = new QueryOptions(
    pg,
    ic,
    undefined,
    undefined,
    options.sortBy,
    options.ascending,
  )
  if (options.all) {
    await logResultAsJson(client!.listAllConfigs(namespace!, queryOptions))
  } else {
    await logResultAsJson(client!.listConfigs(namespace!, queryOptions))
  }
}

export async function showConfig(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')
  await logResultAsJson(client!.getConfig(namespace!, cf))
}

export async function createConfig(
  client: ApiClient,
  namespace: number | undefined,
  name: string,
  description: string,
) {
  handleStandardParams(client, namespace)
  logResultAsJson(client!.createConfig(namespace!, name, description))
}

export async function updateConfig(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
  name: string,
  description: string,
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')
  await logResultAsJson(client!.updateConfig(namespace!, cf, name, description))
}

export async function deleteConfig(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
  options: any,
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')
  let confirmation = true
  if (!options.yes) {
    const config: Config = await client!.getConfig(namespace!, cf)

    confirmation = await getResourceDeletionConfirmation(config)
  }

  if (confirmation) {
    await logSuccess(
      client!.deleteConfig(namespace!, cf, options.force),
      `Config with id ${configId} was successfully deleted`,
    )
  }
}

export async function makeConfig(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
  questionnaireFilepath: string,
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')
  await logDownloadedFile(
    client!.createConfigFromQuestionnaire(
      namespace!,
      cf,
      questionnaireFilepath,
    ),
  )
}

export async function excelConfig(
  client: ApiClient,
  namespace: number | undefined,
  configId: string,
  xlsxFilepath: string,
  configFilepath: string,
) {
  const cf = handleStandardParams(client, namespace, configId, 'configId')
  await logDownloadedFile(
    client!.createConfigFromExcel(namespace!, cf, xlsxFilepath, configFilepath),
  )
}
