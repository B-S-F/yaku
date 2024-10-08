import { Command, Option } from 'commander'
import inquirer from 'inquirer'

import { loginOAuth } from '../oauth.js'
import {
  createEnvironment,
  deleteEnvironment,
  Environment,
  loadEnvironments,
  selectEnvironment,
  updateEnvironmentByKey,
} from './environment.js'
import { Namespace } from '@B-S-F/yaku-client-lib'
import {
  consoleErrorRed,
  handleRestApiError,
  urlToApiUrl,
  validateUrl,
} from '../common.js'
import { selectNamespace } from './namespaces.js'
import { loginToken } from '../token-auth.js'
import { connect } from '../connect.js'

export function createLoginCommand(program: Command) {
  program
    .command('login [envName]')
    .description('Login to the Yaku CLI')
    .showHelpAfterError()
    .addOption(new Option('-u, --url <url>', 'URL of the Yaku instance'))
    .addOption(
      new Option('-n, --namespace <namespace>', 'Yaku namespace to use')
    )
    .addOption(
      new Option('-w, --web', 'Login via web browser').conflicts('token')
    )
    .addOption(
      new Option(
        ', --admin',
        'Login via web browser and retrieve access token that contains admin permissions if available'
      ).conflicts('token')
    )
    .addOption(
      new Option(
        '-t, --token [token]',
        'Access token for the Yaku environment'
      ).conflicts('web')
    )
    .action(async (envName, options) => {
      await login(envName, options)
    })
}

export async function login(
  envName: string,
  options: {
    url: string
    namespace: number
    web: boolean
    token: string | boolean
    admin: boolean
  }
) {
  // get env name
  try {
    envName = await getEnvironment(envName)
  } catch (err) {
    if (err instanceof Error) {
      consoleErrorRed(err.message)
    } else {
      consoleErrorRed(
        'An unknown error occurred while getting the environment name.'
      )
    }
    return
  }
  // get url
  try {
    const url = validateUrl(await getUrl(options.url, envName))
    const apiUrl = urlToApiUrl(url)
    options.url = url

    if (url !== apiUrl) {
      const { updateUrl } = await inquirer.prompt({
        type: 'confirm',
        name: 'updateUrl',
        message: `The specified ${url} is not a valid API url. Do you want to replace it with ${apiUrl}?`,
      })

      if (updateUrl) {
        options.url = apiUrl
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      consoleErrorRed(err.message)
    } else {
      consoleErrorRed(
        'An unknown error occurred while getting the environment URL.'
      )
    }
    return
  }
  // get login method
  let loginMethod: string
  try {
    loginMethod = await getLoginMethod(options)
  } catch (err) {
    if (err instanceof Error) {
      consoleErrorRed(err.message)
    } else {
      consoleErrorRed(
        'An unknown error occurred while getting the login method.'
      )
    }
    return
  }
  // login and create environment
  try {
    await loginAndCreateEnv(loginMethod, envName, options.url, options.token)
    console.log(
      `Login information have been saved to environment '${envName}'.`
    )
    console.log(`Environment '${envName}' is now activated.`)
  } catch (err) {
    if (err instanceof Error) {
      consoleErrorRed(err.message)
    } else {
      consoleErrorRed('An unknown error occurred while logging in.')
    }
    return
  }
  // select namespace
  try {
    await selectNamespaceAndUpdateEnv(envName, options)
  } catch (err) {
    if (err instanceof Error) {
      consoleErrorRed(err.message)
    } else {
      consoleErrorRed(
        'An unknown error occurred while selecting the namespace.'
      )
    }
    return
  }
}

async function getEnvironment(envName: string): Promise<string> {
  if (envName) {
    return envName
  }
  const envs = loadEnvironments()
  const newEnv = await inquirer.prompt({
    type: 'confirm',
    name: 'newEnv',
    message: 'Do you want to create a new environment?',
  })
  if (!newEnv.newEnv) {
    if (envs.length > 0) {
      return await selectEnvironment(envs)
    }
    throw new Error(
      `No environments available for selection, please create one first!`
    )
  }

  const answer = await inquirer.prompt({
    type: 'input',
    name: 'envName',
    message: 'Name of the environment',
  })
  if (envs.find((env) => env.name === answer.envName)) {
    throw new Error(`Environment with name '${answer.envName}' already exists!`)
  }
  return answer.envName
}

async function getUrl(url: string, envName: string): Promise<string> {
  if (!url) {
    const answer = await inquirer.prompt({
      type: 'input',
      name: 'url',
      message: 'URL of the environment',
      default: loadEnvironments().find((env) => env.name === envName)?.url,
    })
    url = answer.url
  }
  return url
}

async function getLoginMethod(options: {
  web: boolean
  admin: boolean
  token: string | boolean
}): Promise<string> {
  let loginMethod: string
  if (options.admin) {
    loginMethod = 'oauth-admin'
  } else if (options.web) {
    loginMethod = 'oauth'
  } else if (options.token && typeof options.token === 'string') {
    loginMethod = 'token'
  } else if (options.token && typeof options.token !== 'string') {
    loginMethod = 'token-prompt'
  } else {
    const answer = await inquirer.prompt({
      type: 'list',
      name: 'loginMethod',
      message: 'How would you like to authenticate Yaku CLI?',
      choices: ['Login with web browser', 'Login with an authentication token'],
    })
    loginMethod =
      answer.loginMethod === 'Login with web browser' ? 'oauth' : 'token-prompt'
  }
  return loginMethod
}

async function loginAndCreateEnv(
  loginMethod: string,
  envName: string,
  url: string,
  token: string | boolean
) {
  let env: Environment
  if (loginMethod === 'oauth') {
    try {
      env = await loginOAuth(envName, url)
    } catch (err) {
      const msg = 'OAuth login failed! Please try again.'
      if (err instanceof Error) {
        throw new Error(`${msg}\nError was: ${err.message}`)
      }
    }
  } else if (loginMethod === 'oauth-admin') {
    try {
      env = await loginOAuth(envName, url, ['global'])
    } catch (err) {
      const msg = 'OAuth admin login failed! Please try again.'
      if (err instanceof Error) {
        throw new Error(`${msg}\nError was: ${err.message}`)
      }
    }
  } else {
    if (loginMethod === 'token-prompt') {
      token = (
        await inquirer.prompt({
          type: 'input',
          name: 'token',
          message: 'Paste your authentication token',
        })
      ).token
    }
    try {
      env = await loginToken(token as string, envName, url)
      createEnvironment(env!)
      const client = (await connect()).client
      await client.listNewTokens() // verify if the token is valid
      return
    } catch (err) {
      await deleteEnvironment(envName, true)
      const msg = 'Token login failed! Please try again.'
      if (err instanceof Error) {
        throw new Error(`${msg}\nError was: ${err.message}`)
      }
    }
  }
  createEnvironment(env!)
}

async function selectNamespaceAndUpdateEnv(
  envName: string,
  options: { namespace: number }
) {
  let namespaces: Namespace[] = []
  const client = (await connect()).client
  let namespaceId: string | number | undefined
  try {
    namespaces = await client.getNamespaces()
  } catch (err) {
    consoleErrorRed('Failed to get namespaces!')
    handleRestApiError(err)
  }
  if (!options.namespace) {
    namespaceId = await selectNamespace(namespaces)
    updateEnvironmentByKey(envName, 'namespace', namespaceId)
  } else {
    namespaceId = Number(options.namespace)
    if (!namespaces.find((ns) => ns.id === namespaceId)) {
      throw new Error('Namespace does not exist!')
    }
    updateEnvironmentByKey(envName, 'namespace', options.namespace.toString())
  }
}
