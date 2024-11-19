// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ApiClient, QueryOptions, SecretMetadata } from '@B-S-F/yaku-client-lib'
import {
  getResourceDeletionConfirmation,
  handleStandardParams,
  logResultAsJson,
  logSuccess,
  parseIntParameter,
} from '../common.js'

export async function exportSecrets(
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
    await logResultAsJson(client!.listAllSecrets(namespace!, queryOptions))
  } else {
    await logResultAsJson(client!.listSecrets(namespace!, queryOptions))
  }
}

export async function createSecret(
  client: ApiClient,
  namespace: number | undefined,
  name: string,
  description: string,
  secret: string,
) {
  handleStandardParams(client, namespace)
  await logResultAsJson(
    client!.createSecret(namespace!, name, secret, description),
  )
}

export async function updateSecret(
  client: ApiClient,
  namespace: number | undefined,
  name: string,
  description: string,
  secret: string,
) {
  handleStandardParams(client, namespace)
  await logResultAsJson(
    client!.updateSecret(namespace!, name, secret, description),
  )
}

export async function deleteSecret(
  client: ApiClient,
  namespace: number | undefined,
  name: string,
  options: any,
) {
  handleStandardParams(client, namespace)
  let confirmation = true

  if (!options.yes) {
    const secretPromise: Promise<SecretMetadata[]> = client!.listAllSecrets(
      namespace!,
      new QueryOptions(1, 20, undefined, undefined, 'name', false),
    )
    const secrets = await secretPromise
    const secret = secrets.find((s) => s.name === name)

    if (!secret) {
      throw new Error(`Secret ${name} does not exist`)
    }

    confirmation = await getResourceDeletionConfirmation(secret)
  }

  if (confirmation) {
    await logSuccess(
      client!.deleteSecret(namespace!, name),
      `Secret ${name} was successfully deleted`,
    )
  }
}
