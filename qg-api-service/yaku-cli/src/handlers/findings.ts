import { ApiClient, QueryOptions } from '@B-S-F/yaku-client-lib'
import {
  handleStandardParams,
  logResultAsJson,
  parseFilterOption,
  parseIntParameter,
} from '../common.js'

export async function listFindings(
  client: ApiClient,
  namespace: number | undefined,
  configIds: string,
  page: string,
  options: any,
) {
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
    options.ascending,
  )

  await logResultAsJson(client.listFindings(namespace!, queryOptions))
}

export async function resolveFinding(
  client: ApiClient,
  namespace: number | undefined,
  id: string,
  options: any,
) {
  handleStandardParams(client, namespace)
  await logResultAsJson(client!.resolveFinding(namespace!, id, options))
}

export async function reopenFinding(
  client: ApiClient,
  namespace: number | undefined,
  id: string,
) {
  handleStandardParams(client, namespace)
  await logResultAsJson(client!.reopenFinding(namespace!, id))
}
