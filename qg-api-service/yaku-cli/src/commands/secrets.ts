// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Command, Option } from 'commander'
import { ApiClient } from '@B-S-F/yaku-client-lib'
import readline from 'readline'
import { handleRestApiError } from '../common.js'
import { connect } from '../connect.js'
import {
  createSecret,
  deleteSecret,
  exportSecrets,
  updateSecret,
} from '../handlers/secrets.js'

export function createSecretsSubcommands(program: Command): void {
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
    .description('List all secrets of the namespace')
    .argument('[page]', 'The page requested, defaults to page 1')
    .option(
      '-i, --itemCount <value>',
      'Number of items requested per page, defaults to 20',
    )
    .option('-a, --ascending', 'Revert sort order for the items')
    .option('--all', 'Retrieve all secrets in one call')
    .option('-s, --sortBy [property]', 'Sort results by the given property')
    .action(async (page: string, options) => {
      try {
        await exportSecrets(client, namespace, page, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('create')
    .alias('c')
    .description('Create a new secret')
    .argument('<name>', 'The name of the new secret')
    .argument(
      '[description]',
      'An optional description to specify the purpose of the secret',
    )
    .addOption(
      new Option(
        '-s, --secret <secret>',
        'The secret value to be stored (Deprecated: For security reasons, please use STDIN to input the secret value)',
      ),
    )
    .action(
      async (
        name: string,
        description: string,
        options: { secret?: string },
      ) => {
        const secret = options.secret
        if (secret) {
          try {
            await createSecret(client, namespace, name, description, secret)
          } catch (err) {
            handleRestApiError(err)
          }
        } else {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          })
          rl.question('Enter the secret value: ', async (secret: string) => {
            rl.close()
            try {
              await createSecret(client, namespace, name, description, secret)
            } catch (err) {
              handleRestApiError(err)
            }
          })
        }
      },
    )

  program
    .command('update')
    .alias('upd')
    .description('Update a secret')
    .argument('<name>', 'The name of the secret to be changed')
    .argument('[description]', 'An optional change of the description')
    .addOption(
      new Option(
        '-s, --secret <secret>',
        'An optional change of the secret value, use empty string to not change the secret (Deprecated: For security reasons, please use STDIN to input the secret value)',
      ),
    )
    .action(
      async (
        name: string,
        description: string,
        options: { secret?: string },
      ) => {
        const secret = options.secret
        if (secret) {
          try {
            await updateSecret(client, namespace, name, description, secret)
          } catch (err) {
            handleRestApiError(err)
          }
        } else {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          })
          rl.question(
            'Enter the new secret value (use empty string to not change the secret): ',
            async (secret: string) => {
              rl.close()
              try {
                await updateSecret(client, namespace, name, description, secret)
              } catch (err) {
                handleRestApiError(err)
              }
            },
          )
        }
      },
    )

  program
    .command('delete')
    .description('Delete a secret')
    .argument('<name>', 'The name of the secret to be changed')
    .option(
      '-y --yes',
      'Skip the confirmation prompt and delete the secret immediately. Use with caution!',
    )
    .action(async (name: string, options) => {
      try {
        await deleteSecret(client, namespace, name, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })
}
