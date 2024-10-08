import { ApiClient } from '@B-S-F/yaku-client-lib'
import inquirer from 'inquirer'
import assert from 'node:assert'
import chalk from 'chalk'

export function parseIntParameter(param: string, name: string): number {
  assert(param?.trim(), `${name} is not a number`)
  const intNumber = Number(param)
  assert(Number.isInteger(intNumber), `${name} is not an integer`)
  return intNumber
}

export async function logResultAsJson(
  dataPromise: Promise<any>
): Promise<void> {
  const data = await dataPromise
  console.log(JSON.stringify(data, null, 2))
}

export async function logDownloadedFile(
  dataPromise: Promise<string>
): Promise<void> {
  const name = await dataPromise
  console.log(`Wrote file ${name}`)
}

export async function logSuccess(
  voidPromise: Promise<void>,
  text: string
): Promise<void> {
  await voidPromise
  console.log(text)
}

// TODO: rename to handleError because it does handle any kind of error, not just REST errors
export function handleRestApiError(err: any, fatal = true) {
  const LINE_INDENT = '  '
  const MAX_TITLE_WIDTH = 15
  const errorDetails: string[] = ['Error:']
  const errorFields = {
    Statuscode: err.status,
    Cause: err.cause,
    Message: err.message,
    Url: err.url,
  }
  for (const [title, field] of Object.entries(errorFields)) {
    if (field) {
      errorDetails.push(`${title}:`.padEnd(MAX_TITLE_WIDTH) + field)
    }
  }
  console.log(
    errorDetails
      .map((msg) => {
        return msg
          .split('\n')
          .join('\n' + LINE_INDENT + ''.padEnd(MAX_TITLE_WIDTH))
      })
      .join('\n' + LINE_INDENT)
  )
  if (fatal) {
    process.exit(1)
  }
}

export function handleStandardParams(
  client: ApiClient | undefined,
  namespace?: number | undefined,
  id?: string,
  name?: string
): number {
  assert(client, 'Client not defined, please check your configuration')
  if (arguments.length > 1) {
    assert(namespace, 'Namespace not defined, please check your configuration')
  }
  return id && name ? parseIntParameter(id, name) : 0
}

export function parseFilterOption(filterBy: string): {
  filterProperty: string | undefined
  filterValues: string[] | undefined
} {
  if (!filterBy) {
    return { filterProperty: undefined, filterValues: undefined }
  }
  const splittedFilterExpression = filterBy
    .split('=')
    .map((entry) => entry.trim())
    .filter((entry) => Boolean(entry))
  if (splittedFilterExpression.length !== 2) {
    return { filterProperty: undefined, filterValues: undefined }
  }
  const filterProperty = splittedFilterExpression[0]
  const filterValues = splittedFilterExpression[1]
    .split(',')
    .map((value) => value.trim())
    .filter((value) => Boolean(value))
  if (filterValues.length === 0) {
    return { filterProperty: undefined, filterValues: undefined }
  }
  return {
    filterProperty,
    filterValues,
  }
}

export async function getResourceDeletionConfirmation(resource: any) {
  console.log('You are about to delete the following resource:')
  console.log(JSON.stringify(resource, null, 2))

  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Do you want to continue?',
      default: false,
    },
  ])

  return answers['continue']
}

export function getFilenameFromUrl(url: string): string {
  const pathParts = new URL(url).pathname.split('/')
  return pathParts.length > 0 ? pathParts[pathParts.length - 1] : ''
}

export function consoleErrorRed(text: string): void {
  console.error(chalk.red(text))
}

export function consoleWarnYellow(text: string): void {
  console.warn(chalk.yellow(text))
}

export function urlToApiUrl(url: string): string {
  const apiEndpoint = '/api/v1'

  url = url.replace(/\/$/, '') // Slash the last / if it exists
  if (!url.endsWith(apiEndpoint)) {
    return url + apiEndpoint
  }
  return url
}

export function validateUrl(url: string): string {
  return new URL(url).toString()
}

export function failWithError(text: string): never {
  consoleErrorRed(text)
  process.exit(1)
}
