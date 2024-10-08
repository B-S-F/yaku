import { Command, Option } from 'commander'
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
import inquirer from 'inquirer'
import SearchBox from 'inquirer-search-list'
import { connect } from '../connect.js'

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
        handleStandardParams(client)
        await logResultAsJson(client.getNamespaces())
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
            `Namespace with id ${namespaceId} not found. Use 'namespaces list' to see available namespaces.`
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
      updateEnvironmentByKey(
        currentEnv.name,
        'namespace',
        namespaceId.toString()
      )
      console.log(`Switched to namespace with id ${namespaceId}`)
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
            client.createNamespaceWithConfig(name, options.initConfigFile)
          )
        }
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
        handleStandardParams(client)
        const ns = parseIntParameter(id, 'id')
        await logResultAsJson(client.getNamespace(ns))
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
      } catch (err) {
        handleRestApiError(err)
      }
    })
}

export async function selectNamespace(
  namespaces: Namespace[]
): Promise<string | undefined> {
  if (namespaces.length === 0) {
    consoleErrorRed('No namespaces available!')
    return
  }
  const choices = namespaces.map((ns) => {
    return ns.name ? ns.id + ' - ' + ns.name : ns.id.toString()
  })
  choices.unshift('<empty> - No namespace')
  inquirer.registerPrompt('search-list', SearchBox)
  let namespaceId: string | undefined
  await inquirer
    .prompt([
      {
        type: 'search-list',
        message: 'Select Namespace',
        name: 'namespace',
        choices: choices,
      },
    ])
    .then(function (answers) {
      if (answers.namespace === '<empty> - No namespace') {
        namespaceId = undefined
        return
      }
      namespaceId = parseInt(answers.namespace.split(' ')[0]).toString()
    })
  return namespaceId
}
