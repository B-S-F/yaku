import { Command } from 'commander'

import {
  ApiClient,
  Config,
  QueryOptions,
} from '@B-S-F/yaku-client-lib'
import {
  getResourceDeletionConfirmation,
  handleRestApiError,
  handleStandardParams,
  logDownloadedFile,
  logResultAsJson,
  logSuccess,
  parseIntParameter,
} from '../common.js'
import { connect } from '../connect.js'

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
      'Number of items requested per page, defaults to 20'
    )
    .option('-a, --ascending', 'Revert sort order for the items')
    .option('--all', 'Retrieve all configs in one call')
    .option('-s, --sortBy [property]', 'Sort results by the given property')
    .action(async (page: string, options) => {
      try {
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
          options.ascending
        )
        if (options.all) {
          await logResultAsJson(
            client!.listAllConfigs(namespace!, queryOptions)
          )
        } else {
          await logResultAsJson(client!.listConfigs(namespace!, queryOptions))
        }
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
        const cf = handleStandardParams(client, namespace, configId, 'configId')
        await logResultAsJson(client!.getConfig(namespace!, cf))
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
      'An optional description to specify the purpose of the config'
    )
    .action(async (name: string, description: string) => {
      try {
        handleStandardParams(client, namespace)
        await logResultAsJson(
          client!.createConfig(namespace!, name, description)
        )
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
      'The new description to specify the purpose of the config'
    )
    .action(async (configId: string, name: string, description: string) => {
      try {
        const cf = handleStandardParams(client, namespace, configId, 'configId')
        await logResultAsJson(
          client!.updateConfig(namespace!, cf, name, description)
        )
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
      'Force the deletion of the config by deleting all connected runs first'
    )
    .option(
      '-y --yes',
      'Skip the confirmation prompt and delete the config immediately. Use with caution!'
    )
    .action(async (configId: string, options) => {
      try {
        const cf = handleStandardParams(client, namespace, configId, 'configId')
        let confirmation = true
        if (!options.yes) {
          const config: Config = await client!.getConfig(namespace!, cf)

          confirmation = await getResourceDeletionConfirmation(config)
        }

        if (confirmation) {
          await logSuccess(
            client!.deleteConfig(namespace!, cf, options.force),
            `Config with id ${configId} was successfully deleted`
          )
        }
      } catch (err: any) {
        if (err.status == 400) {
          console.error(
            'Use the --force option to force the deletion of the config by deleting all connected runs first'
          )
        }
        handleRestApiError(err)
      }
    })

  program
    .command('make-config')
    .alias('mc')
    .description(
      'Create an initial qg-config file from uniform questionnaire data'
    )
    .argument(
      '<configId>',
      'The numeric id of the config for which the initial config should be created'
    )
    .argument(
      '<questionnaireFilepath>',
      'Path to the questionnaire data file which describes the relevant questions for the config'
    )
    .action(async (configId: string, questionnaireFilepath: string) => {
      try {
        const cf = handleStandardParams(client, namespace, configId, 'configId')
        await logDownloadedFile(
          client!.createConfigFromQuestionnaire(
            namespace!,
            cf,
            questionnaireFilepath
          )
        )
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
      'The numeric id of the config for which the initial config should be created'
    )
    .argument(
      '<xlsxFilepath>',
      'Path to the excel sheet which contains the information to create the config'
    )
    .argument(
      '<configFilepath>',
      'Path to the config file which maps the excel sheet columns to relevant information categories'
    )
    .action(
      async (
        configId: string,
        xlsxFilepath: string,
        configFilepath: string
      ) => {
        try {
          const cf = handleStandardParams(
            client,
            namespace,
            configId,
            'configId'
          )
          await logDownloadedFile(
            client!.createConfigFromExcel(
              namespace!,
              cf,
              xlsxFilepath,
              configFilepath
            )
          )
        } catch (err) {
          handleRestApiError(err)
        }
      }
    )
}
