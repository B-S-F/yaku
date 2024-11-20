// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Command } from 'commander'
import { connect } from '../connect.js'

import { ApiClient } from '@B-S-F/yaku-client-lib'
import { handleRestApiError } from '../common.js'
import {
  createNewToken,
  listNewTokens,
  revokeNewToken,
} from '../handlers/newtokens.js'

export function createNewTokensSubcommands(program: Command): void {
  let client: ApiClient
  program.hook('preAction', async () => {
    client = (await connect()).client
  })
  program
    .command('list')
    .alias('ls')
    .description('List your tokens')
    .action(async () => {
      try {
        await listNewTokens(client)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('create')
    .alias('c')
    .description('Create a token')
    .argument(
      '<description>',
      'Description of the token (for example its purpose)',
    )
    .action(async (description: string) => {
      try {
        await createNewToken(client, description)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('revoke')
    .description('Revoke the given token')
    .argument('<id>', 'Id of the token to be deleted')
    .action(async (id: string) => {
      try {
        await revokeNewToken(client, id)
      } catch (err) {
        handleRestApiError(err)
      }
    })
}
