import { Command } from 'commander'
import { connect } from '../connect.js'

import { ApiClient } from '@B-S-F/yaku-client-lib'
import {
  handleRestApiError,
  handleStandardParams,
  logResultAsJson,
  logSuccess,
  parseIntParameter,
} from '../common.js'

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
        handleStandardParams(client)
        await logResultAsJson(client.listNewTokens())
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
      'Description of the token (for example its purpose)'
    )
    .action(async (description: string) => {
      try {
        handleStandardParams(client)
        await logResultAsJson(client.createNewToken(description))
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
        handleStandardParams(client)
        const tokenId = parseIntParameter(id, 'id')
        await logSuccess(
          client.revokeNewToken(tokenId),
          `Token with id ${id} has been revoked. The change will be effective in at most 60 seconds.`
        )
      } catch (err) {
        handleRestApiError(err)
      }
    })
}
