// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Command } from 'commander'

import { ApiClient } from '@B-S-F/yaku-client-lib'
import { handleRestApiError } from '../common.js'
import { connect } from '../connect.js'
import {
  createConfig,
  deleteConfig,
  excelConfig,
  listConfig,
  makeConfig,
  showConfig,
  updateConfig,
} from '../handlers/configs.js'

export function createConfigsCommand(program: Command): void {
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
    .description('List configs in pages')
    .argument('[page]', 'The page requested, defaults to page 1')
    .option(
      '-i, --itemCount <value>',
      'Number of items requested per page, defaults to 20',
    )
    .option('-a, --ascending', 'Revert sort order for the items')
    .option('--all', 'Retrieve all configs in one call')
    .option('-s, --sortBy [property]', 'Sort results by the given property')
    .action(async (page: string, options) => {
      try {
        await listConfig(client, namespace, page, options)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('show')
    .alias('s')
    .description('Show a specific config')
    .argument('<configId>', 'The numeric id of the requested config')
    .action(async (configId: string) => {
      try {
        await showConfig(client, namespace, configId)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('create')
    .alias('c')
    .description('Create a new config')
    .argument('<name>', 'The name of the new config')
    .argument(
      '[description]',
      'An optional description to specify the purpose of the config',
    )
    .action(async (name: string, description: string) => {
      try {
        await createConfig(client, namespace, name, description)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('update')
    .alias('upd')
    .description('Update name or description of a config')
    .argument('<configId>', 'The numeric id of the config to be changed')
    .argument('<name>', 'The new name of the config')
    .argument(
      '[description]',
      'The new description to specify the purpose of the config',
    )
    .action(async (configId: string, name: string, description: string) => {
      try {
        await updateConfig(client, namespace, configId, name, description)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('delete')
    .description('Delete a whole config including all files')
    .argument('<configId>', 'The numeric id of the config to be deleted')
    .option(
      '--force',
      'Force the deletion of the config by deleting all connected runs first',
    )
    .option(
      '-y --yes',
      'Skip the confirmation prompt and delete the config immediately. Use with caution!',
    )
    .action(async (configId: string, options) => {
      try {
        await deleteConfig(client, namespace, configId, options)
      } catch (err: any) {
        if (err.status == 400) {
          console.error(
            'Use the --force option to force the deletion of the config by deleting all connected runs first',
          )
        }
        handleRestApiError(err)
      }
    })

  program
    .command('make-config')
    .alias('mc')
    .description(
      'Create an initial qg-config file from uniform questionnaire data',
    )
    .argument(
      '<configId>',
      'The numeric id of the config for which the initial config should be created',
    )
    .argument(
      '<questionnaireFilepath>',
      'Path to the questionnaire data file which describes the relevant questions for the config',
    )
    .action(async (configId: string, questionnaireFilepath: string) => {
      try {
        await makeConfig(client, namespace, configId, questionnaireFilepath)
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('excel-config')
    .alias('ec')
    .description('Create a config from an excel sheet')
    .argument(
      '<configId>',
      'The numeric id of the config for which the initial config should be created',
    )
    .argument(
      '<xlsxFilepath>',
      'Path to the excel sheet which contains the information to create the config',
    )
    .argument(
      '<configFilepath>',
      'Path to the config file which maps the excel sheet columns to relevant information categories',
    )
    .action(
      async (
        configId: string,
        xlsxFilepath: string,
        configFilepath: string,
      ) => {
        try {
          await excelConfig(
            client,
            namespace,
            configId,
            xlsxFilepath,
            configFilepath,
          )
        } catch (err) {
          handleRestApiError(err)
        }
      },
    )
}
