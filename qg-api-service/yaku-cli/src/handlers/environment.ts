import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { fromZodError } from 'zod-validation-error'
import {
  consoleErrorRed,
  consoleWarnYellow,
  failWithError,
  parseIntParameter,
  urlToApiUrl,
  validateUrl,
} from '../common.js'
import yp, { TableColumn } from '../yaku-prompts.js'
import chalk from 'chalk'

const ENV_NAME_VALIDATION_EXP = /^(|[a-zA-Z0-9]([\-]*[a-zA-Z0-9]+)*)$/

const EnvironmentSchema = z.object({
  name: z.string(),
  url: z.string(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
  namespace: z.number().optional(),
  current: z.boolean().optional(),
})
export type Environment = z.infer<typeof EnvironmentSchema>

const EnvironmentsSchema = z.array(EnvironmentSchema)
export type Environments = z.infer<typeof EnvironmentsSchema>

export async function deleteEnvironment(
  envName: string,
  disableLogging?: boolean | false
) {
  // get env
  const envs = loadEnvironments()
  if (!envName) {
    const name = await selectEnvironment(envs)
    if (!name) {
      consoleErrorRed('No environment was selected!')
      return
    }
    envName = name
  }
  // default environment cannot be deleted
  if (envName === 'default') {
    consoleErrorRed('The default environment cannot be deleted.')
    return
  }
  // delete env
  const envIndex = envs.findIndex((env) => env.name === envName)
  if (envIndex > -1) {
    if (envs[envIndex].current) {
      envs.forEach((env) => {
        if (env.name === 'default') {
          env.current = true
        }
      })
      if (!disableLogging)
        console.log(
          `The current environment was changed from '${envName}' to 'default'.`
        )
    }
    envs.splice(envIndex, 1)
    saveEnvironments(envs)
    if (!disableLogging) console.log(`Environment '${envName}' was deleted.`)
  } else {
    consoleErrorRed(`Environment '${envName}' not found!`)
  }
}

export function createEnvironment(env: Environment) {
  const envs = loadEnvironments()
  // if new environment is current, set all other environments to not current
  if (env.current) {
    envs.forEach((e) => {
      e.current = false
    })
  }
  // replace existing environment if it exists
  const existingEnvIndex = envs.findIndex(
    (e: Environment) => e.name === env.name
  )
  if (existingEnvIndex > -1) {
    envs[existingEnvIndex] = env
  }
  // add new environment if it does not exist
  else {
    envs.push(env)
  }
  saveEnvironments(envs)
}

export function updateEnvironment(envName: string, env: Environment) {
  const envs = loadEnvironments()
  const envIndex = envs.findIndex((e) => e.name === envName)
  if (envIndex > -1) {
    envs[envIndex] = env
    saveEnvironments(envs)
  } else {
    consoleErrorRed(`Environment '${envName}' not found!`)
  }
}

export async function updateEnvironmentByKey(
  envName: string,
  key: string,
  value: string | undefined
) {
  if (!['name', 'url', 'token', 'namespace'].includes(key)) {
    consoleErrorRed(
      `Invalid key '${key}'. Key must be either 'name', 'url', 'token', or 'namespace'.`
    )
    return
  }
  const envs: Environment[] = loadEnvironments()
  const envIndex: number = envs.findIndex((env) => env.name === envName)!
  if (envIndex > -1) {
    if (key === 'url' && value) {
      const oldUrl: string = validateUrl(value)
      const newUrl: string = urlToApiUrl(value)

      if (oldUrl !== newUrl) {
        const updateUrl = await yp.confirm(
          `The specified ${key} is not a valid API url. Do you want to replace it with ${newUrl}?`
        )
        if (updateUrl) {
          value = newUrl
        }
      }
    }

    if (key === 'namespace' && value) {
      envs[envIndex].namespace = parseIntParameter(value, 'namespace')
    } else if (key === 'token') {
      envs[envIndex].accessToken = value
    } else {
      envs[envIndex] = { ...envs[envIndex], [key]: value }
    }
    saveEnvironments(envs)
    console.log(`Updated '${key}' to '${value}' for environment '${envName}'.`)
  } else {
    consoleErrorRed(`Environment '${envName}' not found!`)
  }
}

export function getCurrentEnvironment(envs: Environments): Environment {
  return envs.find((env) => env.current)!
}

export function loadCurrentEnvironment(): Environment {
  const envs = loadEnvironments()
  const currentEnv = getCurrentEnvironment(envs)
  if (!currentEnv) {
    throw new Error(
      'No current environment found. Please login with "yaku login" or switch to an existing environment with "yaku environments switch <envName>"'
    )
  }
  if (!currentEnv.url || !currentEnv.accessToken) {
    throw new Error(
      `Environment '${currentEnv.name}' is incomplete. Please login again with "yaku login ${currentEnv.name} or create a new environment with "yaku environments create"`
    )
  }
  return currentEnv
}

export function loadEnvironments(): Environments {
  const file = getEnvironmentsFilePath()
  const envs = getEnvironmentsFromFile(file)
  try {
    const result = EnvironmentsSchema.safeParse(envs)
    if (result.success) {
      return envs
    } else if (LegacyEnvironmentsConfigSchema.safeParse(envs).success) {
      consoleWarnYellow(
        `Environment configuration file '${file}' found is in a legacy format. It will be converted to the new format.`
      )
      return convertLegacyEnvironments(envs)
    } else {
      failWithError(
        `Environment configuration file '${file}' has an unknown format. ${fromZodError(
          result.error
        )}`
      )
    }
  } catch (err) {
    failWithError(
      `Failed to process environment configuration from file '${file}'. Error was: ${err}`
    )
  }
}

export function saveEnvironments(envs: Environments): void {
  fs.writeFileSync(
    getEnvironmentsFilePath(),
    JSON.stringify(envs, undefined, 2),
    {
      mode: 0o600,
    }
  )
}

export function getEnvironmentsFilePath(): string {
  if (!process.env.HOME) {
    throw new Error(
      '$HOME is not set, cannot find the environment definitions, please ensure the variable to point to your users home folder'
    )
  }
  return path.join(process.env.HOME, process.env.RUNTIME_CONFIG ?? '.yakurc')
}

function getEnvironmentsFromFile(file: string) {
  let jsonContents = undefined
  if (!fs.existsSync(file)) {
    consoleWarnYellow(
      `Creating the initial environment configuration file '${file}'..`
    )
    try {
      saveEnvironments([])
    } catch (err) {
      failWithError(`Failed to create '${file}': ${err}`)
    }
  }
  try {
    jsonContents = fs.readFileSync(file, { encoding: 'utf-8' })
  } catch (err) {
    failWithError(`Failed to access '${file}': ${err}`)
  }
  try {
    return JSON.parse(jsonContents)
  } catch (err) {
    failWithError(`Failed to parse '${file}' as JSON: ${err}`)
  }
}

export async function selectEnvironment(envs: Environments): Promise<string> {
  if (envs.length === 0) {
    failWithError('No environments available')
  }
  const choices = envs.map((env) => {
    if (env.current) {
      return {
        name: `${env.name} [current]`,
        value: env.name,
      }
    }
    return {
      name: env.name,
      value: env.name,
    }
  })
  // put current environment at the top of the list
  choices.sort((a, b) => {
    if (a.name.includes('[current]')) {
      return -1
    }
    if (b.name.includes('[current]')) {
      return 1
    }
    return 0
  })
  const envName: string = await yp.search(
    'Select Environment (type to filter)',
    choices,
    10
  )
  return envName!
}

export function getSelectedEnvironmentIdx(
  rows: (string | number | boolean)[][]
): number | undefined {
  let selectedEnvironmentIdx = undefined
  for (let idx = 0; idx < rows.length; idx++) {
    if (rows[idx][0]) {
      selectedEnvironmentIdx = idx
      break
    }
  }
  return selectedEnvironmentIdx
}

export async function showEnvironmentsTable(
  envs: Environments,
  pageSize?: number
) {
  const columns: TableColumn[] = [
    { name: '●', value: 'current', editable: 'radio' },
    {
      name: 'Name',
      value: 'name',
      editable: 'text',
      sortable: true,
      filterable: true,
      customValidation: (value) => {
        return ENV_NAME_VALIDATION_EXP.test(value)
      },
    },
    {
      name: 'URL',
      value: 'url',
      editable: 'url',
      sortable: true,
      filterable: true,
    },
    {
      name: 'Namespace',
      value: 'namespace',
      editable: 'number',
      sortable: true,
      filterable: true,
      customValidation: (value) => {
        return (
          value === '' || (String(Number(value)) === value && Number(value) > 0)
        )
      },
    },
    { name: 'Access Token', value: 'accessToken' },
    { name: 'Refresh Token', value: 'refreshToken' },
    { name: 'Expires At', value: 'expiresAt' },
  ]

  const rows = envs.map((env) => [
    env.current ? true : false,
    env.name,
    env.url,
    env.namespace ?? '',
    env.accessToken ? '********' : '',
    env.refreshToken ? '********' : '',
    env.expiresAt ? new Date(env.expiresAt * 1000).toLocaleString() : '',
  ])
  if (rows.length === 0) {
    failWithError('No environments available')
  }
  const answer: any[] | undefined = await yp.createTablePrompt({
    message: 'Environments',
    columns: columns,
    rows: rows,
    pageSize: pageSize,
    initWithSelectedRow: getSelectedEnvironmentIdx(rows),
    style: {
      radioOff: '○',
      radioOn: '●',
      checkboxOff: '□',
      checkboxOn: '■',
      scrollHead: '↕',
      scrollSingle: '↕',
      scrollUp: '↑',
      scrollDown: '↓',
      emptyValue: '|',
      sortedAsc: '▲',
      sortedDesc: '▼',
      valueTextValid: chalk.blue,
      valueBgValid: chalk.bgBlue,
      valueTextInvalid: chalk.red,
      valueBgInvalid: chalk.bgRed,
    },
  })
  if (answer) {
    answer.forEach((row: any, index: number) => {
      envs[index].current = row[0]
      envs[index].name = row[1]
      envs[index].url = row[2]
      envs[index].namespace = parseInt(row[3]) || undefined
    })
    saveEnvironments(envs)
    consoleWarnYellow('Environments updated successfully')
  }
}

export async function editEnvironments() {
  const envFilePath = getEnvironmentsFilePath()
  if (process.env.EDITOR) {
    console.log(
      `Opening '${envFilePath}' in ${process.env.EDITOR} external editor..`
    )
  } else {
    console.log(
      `$EDITOR environment variable is not set, opening '${envFilePath}' in default external editor..`
    )
  }
  await yp.openFileInEditor(envFilePath, process.env.EDITOR)
}

// Legacy code can be removed in a future release
// This is the schema for the legacy environment configuration file
// It is kept here to be able to convert the old format to the new format
const LegacyEnvironmentSchema = z.object({
  url: z.string(),
  token: z.string().optional(),
  namespace: z.union([z.number(), z.null()]).optional(),
})

const LegacyEnvironmentListSchema = z.record(LegacyEnvironmentSchema)

const LegacyEnvironmentsConfigSchema = z.object({
  currentEnvironment: z.union([z.string(), z.null()]),
  environments: LegacyEnvironmentListSchema,
})
type LegacyEnvironmentsConfig = z.infer<typeof LegacyEnvironmentsConfigSchema>

function convertLegacyEnvironments(
  legacyConfig: LegacyEnvironmentsConfig
): Environments {
  const environments: Environments = []
  for (const [name, env] of Object.entries(legacyConfig.environments)) {
    environments.push({
      name,
      url: env.url,
      accessToken: env.token,
      namespace: env.namespace || undefined,
      current: legacyConfig.currentEnvironment === name,
    })
  }
  return environments
}
