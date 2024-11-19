// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ApiClient } from '@B-S-F/yaku-client-lib'
import { Command } from 'commander'
import { connect } from '../connect.js'
import { handleRestApiError } from '../common.js'
import {
  deleteRelease,
  listReleases,
  showRelease,
} from '../handlers/releases.js'

export function createReleasesSubcommands(program: Command): void {
  let client: ApiClient
  let namespace: number | undefined
  program.hook('preAction', async () => {
    const connection = await connect()
    client = connection.client
    namespace = connection.namespace
  })
  program
    .command('list')
    .alias('ls')
    .description('List all releases')
    .argument('[page]', 'The page requested, defaults to page 1')
    .option(
      '-i, --itemCount <value>',
      'Number of items requested per page, defaults to 20',
    )
    .option('-a, --ascending', 'Revert sort order for the items')
    .option('-s, --sortBy [property]', 'Sort results by the given property')
    .option(
      '-f, --filterBy [property=value1,value2]',
      'Filter values according to the given property, show only elements which have one of the given value',
    )
    .action(async (page: string, options) => {
      try {
        await listReleases(client, namespace, page, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })
  program
    .command('show')
    .alias('s')
    .description('Show a specific release')
    .argument('<releaseId>', 'The numeric id of the requested config')
    .action(async (releaseId: string) => {
      try {
        await showRelease(client, namespace, releaseId)
      } catch (err) {
        handleRestApiError(err)
      }
    })
  program
    .command('delete')
    .description('Delete a release')
    .argument('<releaseId>', 'The numeric id of the release to be deleted')
    .option(
      '-y --yes',
      'Skip the confirmation prompt and delete the release immediately. Use with caution!',
    )
    .action(async (releaseId: string, options) => {
      try {
        await deleteRelease(client, namespace, releaseId, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })
}
