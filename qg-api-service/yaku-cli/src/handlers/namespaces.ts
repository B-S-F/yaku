// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ApiClient, Namespace } from '@B-S-F/yaku-client-lib'
import {
  consoleErrorRed,
  consoleWarnYellow,
  handleRestApiError,
  handleStandardParams,
  logResultAsJson,
  parseIntParameter,
} from '../common.js'
import {
  getCurrentEnvironment,
  loadEnvironments,
  updateEnvironmentByKey,
} from './environment.js'
import yp from '../yaku-prompts.js'

export async function selectNamespace(
  namespaces: Namespace[],
): Promise<string | undefined> {
  if (namespaces.length === 0) {
    consoleErrorRed('No namespaces available!')
    return
  }
  const choices = namespaces.map((ns) => {
    const choice = ns.name ? ns.id + ' - ' + ns.name : ns.id.toString()
    return {
      name: choice,
      value: ns.id.toString(),
    }
  })
  choices.unshift({ name: '<empty> - No namespace', value: '' })
  const namespaceId: string = await yp.search(
    'Select Namespace (type to filter)',
    choices,
    10,
  )
  return namespaceId || undefined
}

export async function listNamespaces(client: ApiClient) {
  handleStandardParams(client)
  await logResultAsJson(client.getNamespaces())
}

export async function switchNamespace(client: ApiClient, namespaceId: any) {
  handleStandardParams(client)
  let namespaces: Namespace[] = []
  try {
    namespaces = await client.getNamespaces()
  } catch (err) {
    handleRestApiError(err)
  }
  if (namespaceId) {
    namespaceId = parseIntParameter(namespaceId, 'namespace')
    if (!namespaces.find((ns) => ns.id === namespaceId)) {
      consoleErrorRed(
        `Namespace with id ${namespaceId} not found. Use 'namespaces list' to see available namespaces.`,
      )
      return
    }
  } else {
    namespaceId = await selectNamespace(namespaces)
    if (!namespaceId) {
      consoleErrorRed('No namespace was selected!')
      return
    }
  }
  const envs = loadEnvironments()
  const currentEnv = getCurrentEnvironment(envs)
  updateEnvironmentByKey(currentEnv.name, 'namespace', namespaceId.toString())
  console.log(`Switched to namespace with id ${namespaceId}`)
}

export async function createNamespace(
  client: ApiClient,
  name: string,
  users: string[],
  options: any,
) {
  handleStandardParams(client)

  if (users.length > 0) {
    consoleWarnYellow(`
      DEPRECATION WARNING: "users" argument will be removed soon.
      Your input "${users.join(' ')}" is ignored
    `)
  }

  if (!options.initConfigFile) {
    await logResultAsJson(client.createNamespace(name))
  } else {
    await logResultAsJson(
      client.createNamespaceWithConfig(name, options.initConfigFile),
    )
  }
}

export async function showNamespaces(client: ApiClient, id: string) {
  handleStandardParams(client)
  const ns = parseIntParameter(id, 'id')
  await logResultAsJson(client.getNamespace(ns))
}

export async function updateNamespace(
  client: ApiClient,
  id: string,
  options: any,
) {
  handleStandardParams(client)
  const ns = parseIntParameter(id, 'id')

  if (options.users !== undefined) {
    consoleWarnYellow(`
      DEPRECATION WARNING: --users option will be removed soon.
      Your input "--users ${options.users.join(' ')}" is ignored
    `)
  }

  if (options.mode !== undefined) {
    consoleWarnYellow(`
      DEPRECATION WARNING: --mode option will be removed soon.
      Your input "--mode ${options.mode}" is ignored
    `)
  }

  await logResultAsJson(client.updateNamespace(ns, options.name))
}
