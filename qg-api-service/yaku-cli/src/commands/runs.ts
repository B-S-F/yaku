import { Command } from 'commander'
import { ApiClient, QueryOptions, Run } from '@B-S-F/yaku-client-lib'
import {
  handleRestApiError,
  handleStandardParams,
  logDownloadedFile,
  logResultAsJson,
  logSuccess,
  parseFilterOption,
  parseIntParameter,
} from '../common.js'
import { connect } from '../connect.js'

export function createRunsSubcommands(program: Command): void {
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
    .description('List runs in pages')
    .argument('[page]', 'The page requested, defaults to page 1')
    .option(
      '-i, --itemCount <value>',
      'Number of items requested per page, defaults to 20'
    )
    .option('-a, --ascending', 'Revert sort order for the items')
    .option('--all', 'Retrieve all runs in one call')
    .option('-s, --sortBy [property]', 'Sort results by the given property')
    .option(
      '-f, --filterBy [property=value1,value2]',
      'Filter values according to the given property, show only elements which have one of the given value'
    )
    .option('-lo, --latestOnly', 'Show for each config only the latest run')
    .action(async (page: string, options) => {
      try {
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
        if (options.latestOnly) {
          filterProperty.push('latestOnly')
          filterValues.push(['true'])
        }
        const queryOptions = new QueryOptions(
          pg,
          ic,
          filterProperty,
          filterValues,
          options.sortBy,
          options.ascending
        )
        if (options.all) {
          await logResultAsJson(client!.listAllRuns(namespace!, queryOptions))
        } else {
          await logResultAsJson(client!.listRuns(namespace!, queryOptions))
        }
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('show')
    .alias('s')
    .description('Show data of a specific run')
    .argument('<runId>', 'The numeric id of the requested run')
    .option('-d, --details', 'Show debug information of the run as well')
    .action(async (runId: string, options) => {
      try {
        const rn = handleStandardParams(client, namespace, runId, 'runId')
        await logResultAsJson(
          client!.getRun(namespace!, rn, Boolean(options.details))
        )
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('create')
    .alias('c')
    .description('Start the execution of a run')
    .argument(
      '<configId>',
      'The numeric id of the config to be used for the run'
    )
    .option(
      '-w, --wait',
      'Wait for the run to finish and show result, poll-interval in seconds'
    )
    .option(
      '--poll-interval <value>',
      'Poll interval in seconds, defaults to 10 seconds',
      '10'
    )
    .option('-d, --details', 'Show debug information of the run as well')
    .option(
      '-e, --environment [values...]',
      'Add/override environment variables in the format "KEY1 VALUE1 KEY2 VALUE2 ...' +
        'Do NOT provide secrets. They will be ignored anyways." '
    )
    .action(async (configId: string, options) => {
      const environment: { [key: string]: string } = {}
      if (options.environment != null) {
        if (options.environment.length % 2 != 0) {
          program.error(
            'Error: You provided additional environment variables but in the wrong format. Correct: KEY1 VALUE1 KEY2 VALUE2 ...',
            { exitCode: 1 }
          )
        }

        for (let i = 0; i < options.environment.length; i += 2) {
          const key: string = options.environment[i]
          if (key.length == 0) {
            program.error(
              'Error: You provided an environment variable with an empty key',
              { exitCode: 1 }
            )
          }
          environment[key] = options.environment[i + 1]
        }
      }
      try {
        const cf = handleStandardParams(client, namespace, configId, 'configId')
        let result: Run
        if (options.wait) {
          const pollInterval = parseIntParameter(
            options.pollInterval,
            'poll-interval'
          )
          result = await client!.startAndAwaitRun(
            namespace!,
            cf,
            environment,
            pollInterval * 1000
          )
        } else {
          result = await client!.startRun(namespace!, cf, environment)
        }
        if (!options.details) {
          delete result.argoName
          delete result.argoNamespace
          delete result.log
        }
        await logResultAsJson(Promise.resolve(result))
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('result')
    .alias('res')
    .description('Download the result file of a run')
    .argument('<runId>', 'The numeric id of the requested run')
    .action(async (runId: string) => {
      try {
        const rn = handleStandardParams(client, namespace, runId, 'runId')
        await logDownloadedFile(client!.getRunResult(namespace!, rn))
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('evidences')
    .alias('ev')
    .description('Download the evidences file of a run')
    .argument('<runId>', 'The numeric id of the requested run')
    .action(async (runId: string) => {
      try {
        const rn = handleStandardParams(client, namespace, runId, 'runId')
        await logDownloadedFile(client!.getRunEvidences(namespace!, rn))
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('delete')
    .description('Delete a finished run')
    .argument('<runId>', 'The numeric id of the run to be deleted')
    .action(async (runId: string) => {
      try {
        const rn = handleStandardParams(client, namespace, runId, 'runId')
        await logSuccess(
          client!.deleteRun(namespace!, rn),
          `Run with id ${runId} was successfully deleted`
        )
      } catch (err) {
        handleRestApiError(err)
      }
    })
}
