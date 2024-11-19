// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ApiClient, QueryOptions, Release } from '@B-S-F/yaku-client-lib'
import {
  getResourceDeletionConfirmation,
  handleStandardParams,
  logResultAsJson,
  logSuccess,
  parseFilterOption,
  parseIntParameter,
} from '../common.js'

export async function listReleases(
  client: ApiClient,
  namespace: number | undefined,
  page: string,
  options: any
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

  const queryOptions = new QueryOptions(
    pg,
    ic,
    filterProperty,
    filterValues,
    options.sortBy,
    options.ascending
  )
  await logResultAsJson(client.getReleases(namespace!, queryOptions))
}

export async function showRelease(
  client: ApiClient,
  namespace: number | undefined,
  releaseId: string
) {
  const rl = handleStandardParams(client, namespace, releaseId, 'releaseId')
  await logResultAsJson(client!.getRelease(namespace!, rl))
}

export async function deleteRelease(
  client: ApiClient,
  namespace: number | undefined,
  releaseId: string,
  options: any
) {
  const releaseIdNumber = handleStandardParams(
    client,
    namespace,
    releaseId,
    'releaseId'
  )
  let confirmation = true
  if (!options.yes) {
    const release: Release = await client!.getRelease(
      namespace!,
      releaseIdNumber
    )

    confirmation = await getResourceDeletionConfirmation(release)
  }

  if (confirmation) {
    await logSuccess(
      client!.deleteRelease(namespace!, releaseIdNumber),
      `Release with id ${releaseId} was successfully deleted`
    )
  }
}
