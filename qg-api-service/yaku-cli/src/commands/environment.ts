// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Command, Option } from 'commander'
import { login } from '../handlers/login.js'
import { consoleErrorRed } from '../common.js'
import {
  deleteEnvironment,
  editEnvironments,
  Environment,
  loadEnvironments,
  saveEnvironments,
  selectEnvironment,
  showEnvironmentsTable,
  updateEnvironmentByKey,
} from '../handlers/environment.js'

export function createEnvsSubcommands(program: Command): void {
  program
    .command('update')
    .aliases(['upd', 'set', 'u'])
    .description('Update an existing environment')
    .showHelpAfterError()
    .argument('<envName>', 'Name of the environment')
    .argument(
      '<key>',
      `Key of the environment property, either 'name', 'url', 'token', or 'namespace'`,
    )
    .argument('<value>', 'Value for the specified key')
    .addHelpText(
      'after',
      `
  Aliases:
    update | upd | set | u
        `,
    )
    .action(async (envName: string, key: keyof Environment, value: string) => {
      await updateEnvironmentByKey(envName, key, value)
    })
  program
    .command('list')
    .alias('ls')
    .description('List all available environments')
    .option('-j, --json', 'Output as JSON')
    .addOption(
      new Option(
        '-p, --page-size <pageSize>',
        'Number of elements per page in the table',
      ).conflicts('json'),
    )
    .action((options) => {
      const envs = loadEnvironments()
      if (options.json) {
        console.log(JSON.stringify(envs, null, 2))
      } else {
        showEnvironmentsTable(envs, options.pageSize)
      }
    })
  program
    .command('edit')
    .alias('e')
    .description('Edit environments config file in external text editor')
    .action(async () => {
      editEnvironments()
    })
  program
    .command('switch [envName]')
    .alias('sw')
    .description('Switch to a different environment')
    .action(async (envName) => {
      const envs = loadEnvironments()
      if (!envName) {
        envName = await selectEnvironment(envs)
      }
      // change current environment
      const envIndex = envs.findIndex((env) => env.name === envName)
      if (envIndex > -1) {
        envs.forEach((env) => {
          env.current = false
        })
        envs[envIndex].current = true
        saveEnvironments(envs)
        console.log(`Switched to environment '${envName}'`)
      } else {
        consoleErrorRed(`Environment '${envName}' not found!`)
      }
    })
  program
    .command('create')
    .alias('c')
    .description('Create a new Yaku CLI environment')
    .showHelpAfterError()
    .argument('<envName>', 'Name of the Yaku CLI environment')
    .addOption(new Option('-u, --url <url>', 'URL of the Yaku instance'))
    .addOption(
      new Option('-n, --namespace <namespace>', 'Yaku namespace to use'),
    )
    .addOption(
      new Option('-w, --web', 'Login via web browser').conflicts('token'),
    )
    .addOption(
      new Option(
        '-t, --token [token]',
        'Access token for the Yaku instance',
      ).conflicts('web'),
    )
    .action(async (envName: string, options: any) => {
      await login(envName, options)
    })
  program
    .command('delete')
    .description('Delete a Yaku CLI environment')
    .showHelpAfterError()
    .argument('[envName]', 'Name of the Yaku CLI environment')
    .action(async (envName: string) => {
      await deleteEnvironment(envName)
    })
}
