// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Command } from 'commander'
import { ApiClient } from '@B-S-F/yaku-client-lib'
import { handleRestApiError } from '../common.js'
import { connect } from '../connect.js'
import {
  createRun,
  deleteRun,
  getRunEnvironment,
  getRunEvidences,
  getRunResult,
  listRuns,
  showRun,
} from '../handlers/runs.js'

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
      'Number of items requested per page, defaults to 20',
    )
    .option('-a, --ascending', 'Revert sort order for the items')
    .option('--all', 'Retrieve all runs in one call')
    .option('-s, --sortBy [property]', 'Sort results by the given property')
    .option(
      '-f, --filterBy [property=value1,value2]',
      'Filter values according to the given property, show only elements which have one of the given value',
    )
    .option('-lo, --latestOnly', 'Show for each config only the latest run')
    .action(async (page: string, options) => {
      try {
        await listRuns(client, namespace, page, options)
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
        await showRun(client, namespace, runId, options)
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
      'The numeric id of the config to be used for the run',
    )
    .option(
      '-w, --wait',
      'Wait for the run to finish and show result, poll-interval in seconds',
    )
    .option(
      '--poll-interval <value>',
      'Poll interval in seconds, defaults to 10 seconds',
      '10',
    )
    .option('-d, --details', 'Show debug information of the run as well')
    .option(
      '-e, --environment [values...]',
      'Add/override environment variables in the format "KEY1 VALUE1 KEY2 VALUE2 ...' +
        'Do NOT provide secrets. They will be ignored anyways." ',
    )
    .action(async (configId: string, options) => {
      const environment: { [key: string]: string } = getRunEnvironment(
        program,
        options,
      )
      try {
        await createRun(client, namespace, configId, options, environment)
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
        await getRunResult(client, namespace, runId)
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
        await getRunEvidences(client, namespace, runId)
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
        await deleteRun(client, namespace, runId)
      } catch (err) {
        handleRestApiError(err)
      }
    })
}
