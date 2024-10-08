import { ApiClient, QueryOptions } from '@B-S-F/yaku-client-lib'
import { Command } from 'commander'
import {
  handleRestApiError,
  handleStandardParams,
  logResultAsJson,
  parseFilterOption,
  parseIntParameter,
} from '../common.js'
import { connect } from '../connect.js'

export function createFindingsSubcommands(program: Command): void {
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
    .description('List findings for a config')
    .argument('<config>', 'The id of the config')
    .argument('[page]', 'The page requested, defaults to page 1')
    .option(
      '-i, --itemCount <value>',
      'Number of items requested per page, defaults to 20'
    )
    .option('-a, --ascending', 'Revert sort order for the items')
    .option('--all', 'Retrieve all findings in one call')
    .option('-s, --sortBy [property]', 'Sort results by the given property')
    .option(
      '-f, --filterBy [property=value1,value2]',
      'Filter values according to the given property, show only elements which have one of the given values'
    )
    .action(async (configIds: string, page: string, options) => {
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

        // Add configId as the mandatory filter
        const configIdOption = parseFilterOption('configId=' + configIds)

        filterProperty.push(configIdOption.filterProperty!)
        filterValues.push(configIdOption.filterValues!)

        const queryOptions = new QueryOptions(
          pg,
          ic,
          filterProperty,
          filterValues,
          options.sortBy,
          options.ascending
        )

        await logResultAsJson(client.listFindings(namespace!, queryOptions))
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('resolve')
    .alias('r')
    .description('Resolve a finding')
    .argument('<id>', 'The id of the finding')
    .option('-c, --comment <comment>', 'Comment for the resolution')
    .action(async (id: string, options) => {
      try {
        handleStandardParams(client, namespace)
        await logResultAsJson(client!.resolveFinding(namespace!, id, options))
      } catch (err) {
        handleRestApiError(err)
      }
    })

  program
    .command('reopen')
    .alias('ro')
    .description('Reopen a finding')
    .argument('<id>', 'The id of the finding')
    .action(async (id: string) => {
      try {
        handleStandardParams(client, namespace)
        await logResultAsJson(client!.reopenFinding(namespace!, id))
      } catch (err) {
        handleRestApiError(err)
      }
    })
}
