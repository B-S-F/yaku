import { Command, Option } from 'commander'
import { ApiClient } from '@B-S-F/yaku-client-lib'
import { handleRestApiError } from '../common.js'
import { connect } from '../connect.js'
import {
  createNamespace,
  listNamespaces,
  showNamespaces,
  switchNamespace,
  updateNamespace,
} from '../handlers/namespaces.js'

export function createNamespacesSubcommands(program: Command): void {
  let client: ApiClient
  program.hook('preAction', async () => {
    client = (await connect()).client
  })
  program
    .command('list')
    .alias('ls')
    .description('List all namespaces visible for given user')
    .action(async () => {
      try {
        await listNamespaces(client)
      } catch (err) {
        handleRestApiError(err)
      }
    })
  program
    .command('switch [namespaceId]')
    .alias('sw')
    .alias('select')
    .description('Switch to a different namespace')
    .action(async (namespaceId) => {
      await switchNamespace(client, namespaceId)
    })
  program
    .command('create')
    .alias('c')
    .description('Create a new namespace (admin access required)')
    .argument('<name>', 'Name of the namespace')
    .argument(
      '[users...]',
      'IGNORED - DEPRECATED - WILL BE REMOVED IN THE FUTURE'
    )
    .option(
      '-i, --init-config-file <qg-config-path>',
      'Adds an config object with a qg-config file to the namespace'
    )
    .action(async (name: string, users: string[], options) => {
      try {
        await createNamespace(client, name, users, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('show')
    .alias('s')
    .description('Show a specific namespace')
    .argument('<id>', 'Id of the namespace to be shown')
    .action(async (id: string) => {
      try {
        await showNamespaces(client, id)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('update')
    .alias('upd')
    .usage('<id> [options]')
    .description('Update a namespace (admin access required)')
    .argument('<id>', 'Id of the namespace to be changed')
    .addOption(
      new Option('-n, --name <name>', 'Name of the namespace').default('')
    )
    .addOption(
      new Option(
        '-u, --users [users...]',
        'IGNORED - DEPRECATED - WILL BE REMOVED IN THE FUTURE'
      )
    )
    .addOption(
      new Option(
        '-m, --mode <type>',
        'IGNORED - DEPRECATED - WILL BE REMOVED IN THE FUTURE'
      )
    )
    .action(async (id: string, options) => {
      try {
        await updateNamespace(client, id, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })
}
