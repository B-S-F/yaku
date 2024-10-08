import { Command, Option } from 'commander'
import fs from 'fs'
import path from 'path'
import open from 'open'
import inquirer from 'inquirer'
import { z } from 'zod'
import { login } from './login.js'
import { fromZodError } from 'zod-validation-error'
import chalk from 'chalk'
import SearchBox from 'inquirer-search-list'
import {
  consoleErrorRed,
  consoleWarnYellow,
  failWithError,
  parseIntParameter,
  urlToApiUrl,
  validateUrl,
} from '../common.js'
import { YakuTableInput } from '../extensions/yaku-table-input.js'

const isWindowsPlatform = process.platform.startsWith('win')

export function createEnvsSubcommands(program: Command): void {
  program
    .command('update')
    .aliases(['upd', 'set', 'u'])
    .description('Update an existing environment')
    .showHelpAfterError()
    .argument('<envName>', 'Name of the environment')
    .argument(
      '<key>',
      `Key of the environment property, either 'name', 'url', 'token', or 'namespace'`
    )
    .argument('<value>', 'Value for the specified key')
    .addHelpText(
      'after',
      `
  Aliases:
    update | upd | set | u
        `
    )
    .action(async (envName: string, key: keyof Environment, value: string) => {
      await updateEnvironmentByKey(envName, key, value)
    })
  program
    .command('list')
    .alias('ls')
    .description('List all available environments')
    .option('-j, --json', 'Output as JSON')
    .action((options) => {
      const envs = loadEnvironments()
      if (options.json) {
        console.log(JSON.stringify(envs, null, 2))
      } else {
        showEnvironmentsTable(envs)
      }
    })
  program
    .command('edit')
    .alias('e')
    .description('Edit environments config file in external text editor')
    .action(async () => {
      const envFilePath = getEnvironmentsFilePath()
      console.log(`Opening '${envFilePath}' in external editor..`)
      open(envFilePath)
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
      new Option('-n, --namespace <namespace>', 'Yaku namespace to use')
    )
    .addOption(
      new Option('-w, --web', 'Login via web browser').conflicts('token')
    )
    .addOption(
      new Option(
        '-t, --token [token]',
        'Access token for the Yaku instance'
      ).conflicts('web')
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
        const { updateUrl } = await inquirer.prompt({
          type: 'confirm',
          name: 'updateUrl',
          message: `The specified ${key} is not a valid API url. Do you want to replace it with ${newUrl}?`,
        })
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

function saveEnvironments(envs: Environments): void {
  fs.writeFileSync(
    getEnvironmentsFilePath(),
    JSON.stringify(envs, undefined, 2),
    {
      mode: 0o600,
    }
  )
}

function getEnvironmentsFilePath(): string {
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
  let envName: string
  const choices = envs.map((env) => {
    if (env.current) {
      return `${env.name} [current]`
    }
    return env.name
  })
  // put current environment at the top of the list
  choices.sort((a, b) => {
    if (a.includes('current')) {
      return -1
    }
    if (b.includes('current')) {
      return 1
    }
    return 0
  })
  if (!isWindowsPlatform) {
    inquirer.registerPrompt('search-list', SearchBox)
  }
  await inquirer
    .prompt([
      {
        type: isWindowsPlatform ? 'list' : 'search-list',
        message: 'Select Environment',
        name: 'envName',
        choices: choices,
      },
    ])
    .then(function (answers) {
      if (answers.envName.includes('current')) {
        envName = answers.envName.slice(0, -10)
      } else {
        envName = answers.envName
      }
    })
  return envName!
}

function showEnvironmentsTable(envs: Environments) {
  const columns = [
    { name: chalk.cyan.bold('●'), value: 'current' },
    { name: chalk.cyan.bold('Name'), value: 'name', editable: 'text' },
    { name: chalk.cyan.bold('URL'), value: 'url', editable: 'url' },
    {
      name: chalk.cyan.bold('Namespace'),
      value: 'namespace',
      editable: 'number',
    },
    { name: chalk.cyan.bold('Access Token'), value: 'accessToken' },
    { name: chalk.cyan.bold('Refresh Token'), value: 'refreshToken' },
    { name: chalk.cyan.bold('Expires At'), value: 'expiresAt' },
  ]

  const rows = envs.map((env) => [
    env.current ? '●' : '',
    env.name,
    env.url,
    env.namespace ?? '',
    env.accessToken ? '********' : '',
    env.refreshToken ? '********' : '',
    env.expiresAt ? new Date(env.expiresAt * 1000).toLocaleString() : '',
  ])
  inquirer.registerPrompt('table-input', YakuTableInput)
  inquirer
    .prompt([
      {
        type: 'table-input',
        name: 'environments',
        message: 'Environments',
        infoMessage: `Navigate and Edit`,
        hideInfoWhenKeyPressed: true,
        freezeColumns: 1,
        selectedColor: chalk.red,
        editableColor: chalk.green,
        editingColor: chalk.bgGreen.bold,
        columns: columns,
        rows: rows,
        validate: () => false,
      },
    ])
    .then((answers) => {
      if (answers.environments.state) {
        answers.environments.result.forEach((row: any, index: number) => {
          envs[index].name = row.name
          envs[index].url = row.url
          envs[index].namespace = parseInt(row.namespace) || undefined
        })
        saveEnvironments(envs)
      }
    })
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
