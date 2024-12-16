// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { jest } from '@jest/globals'
import {
  login,
  getEnvironment,
  getUrl,
  getLoginMethod,
  loginAndCreateEnv,
  selectNamespaceAndUpdateEnv,
} from './login'
import { ApiClient, Namespace, NewTokenMetadata } from '@B-S-F/yaku-client-lib'
import fs from 'fs'
import yp from '../yaku-prompts.js'
import { OAuthClient } from '../oauth'
import { Environment } from './environment'
import chalk from 'chalk'

const testEnvHome = '/tmp'
const testUrl = 'http://dot.com'
const testName = 'env1'
const errorMsg = 'errorMsg'
const oauthErrorMsg = `OAuth admin login failed! Please try again.\nError was: ${errorMsg}`
const testEnvs: Environment[] = [
  {
    name: testName,
    url: testUrl,
    current: true,
    accessToken: 'at',
    namespace: 1,
  },
]
const testLoginResponse = {
  accessToken: '',
  refreshToken: '',
}

describe('login()', () => {
  const originalEnv = process.env
  let writeFileSyncSpy: any
  let consoleErrorSpy: any
  let consoleLogSpy: any
  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      return
    })
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {
      return
    })
    jest.spyOn(process, 'exit').mockImplementation((number) => {
      throw new Error('process.exit: ' + number)
    })
  })
  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })
  it('should fail to login due to environments load error', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('!')

    await login('', {
      url: `${testUrl}/api/v1`,
      namespace: 1,
      web: false,
      token: false,
      admin: true,
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red(
        `Failed to parse '${testEnvHome}/.yakurc' as JSON: SyntaxError: Unexpected token '!' is not valid JSON`,
      ),
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.red('process.exit: 1'))
  })
  it('should fail to login due to malformed url', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testEnvs))

    await login(testName, {
      url: `12345`,
      namespace: 1,
      web: false,
      token: false,
      admin: true,
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red('An unknown error occurred while getting the environment URL.'),
    )
  })
  it('should fail to login due to login method', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testEnvs))
    jest.spyOn(yp, 'select').mockRejectedValue(Error(errorMsg))

    await login(testName, {
      url: `${testUrl}/api/v1`,
      namespace: 1,
      web: false,
      admin: false,
      token: false,
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.red(errorMsg))
  })
  it('should fail to login due to auth login', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testEnvs))
    jest.spyOn(yp, 'select').mockResolvedValue('oauth')
    jest
      .spyOn(OAuthClient.prototype, 'connect')
      .mockRejectedValue(Error(errorMsg))

    await login(testName, {
      url: `${testUrl}/api/v1`,
      namespace: 1,
      web: false,
      admin: true,
      token: false,
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.red(oauthErrorMsg))
  })
  it('should fail to login due to namespaces', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testEnvs))
    jest.spyOn(yp, 'select').mockResolvedValue('oauth')
    jest.spyOn(OAuthClient.prototype, 'connect').mockResolvedValue()
    jest
      .spyOn(OAuthClient.prototype, 'login')
      .mockResolvedValue(testLoginResponse)
    jest
      .spyOn(ApiClient.prototype, 'getNamespaces')
      .mockRejectedValue(Error(errorMsg))

    await login(testName, {
      url: `${testUrl}/api/v1`,
      namespace: 1,
      web: false,
      admin: false,
      token: false,
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red('Failed to get namespaces!'),
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(chalk.red('process.exit: 1'))
  })
  it('should login and update the environment', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testEnvs))
    jest.spyOn(yp, 'select').mockResolvedValue('oauth')
    jest.spyOn(OAuthClient.prototype, 'connect').mockResolvedValue()
    jest
      .spyOn(OAuthClient.prototype, 'login')
      .mockResolvedValue(testLoginResponse)
    jest
      .spyOn(ApiClient.prototype, 'getNamespaces')
      .mockResolvedValue([{ id: 1 }] as Namespace[])

    await login(testName, {
      url: `${testUrl}/api/v1`,
      namespace: 1,
      web: false,
      admin: false,
      token: false,
    })

    expect(writeFileSyncSpy).toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Login information have been saved to environment '${testName}'.`,
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Environment '${testName}' is now activated.`,
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Updated 'namespace' to '1' for environment '${testName}'.`,
    )
  })
})

describe('getEnvironment()', () => {
  const originalEnv = process.env
  const envs = [
    {
      name: testName,
      url: testUrl,
    },
  ]
  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
  })
  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })
  it('should return the provided environment', async () => {
    await expect(getEnvironment(testName)).resolves.toEqual(testName)
  })
  it('should return the selected environment', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(envs))
    jest.spyOn(yp, 'confirm').mockResolvedValue(false)
    jest.spyOn(yp, 'search').mockResolvedValue(testName)

    await expect(getEnvironment('')).resolves.toEqual(testName)
  })
  it('should return the created environment', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('[]')
    jest.spyOn(yp, 'confirm').mockResolvedValue(true)
    jest.spyOn(yp, 'input').mockResolvedValue(testName)

    await expect(getEnvironment('')).resolves.toEqual(testName)
  })
  it('should fail with environment name clash error', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(envs))
    jest.spyOn(yp, 'confirm').mockResolvedValue(true)
    jest.spyOn(yp, 'input').mockResolvedValue(testName)

    await expect(getEnvironment('')).rejects.toThrow(
      Error(`Environment with name '${testName}' already exists!`),
    )
  })
  it('should fail with empty list of environments error', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('[]')
    jest.spyOn(yp, 'confirm').mockResolvedValue(false)

    await expect(getEnvironment('')).rejects.toThrow(
      Error(
        'No environments available for selection, please create one first!',
      ),
    )
  })
})

describe('getUrl()', () => {
  let inputSpy: any
  beforeEach(() => {
    inputSpy = jest.spyOn(yp, 'input').mockResolvedValue(testUrl)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should return the provided environment', async () => {
    await expect(getUrl(testUrl, testName)).resolves.toEqual(testUrl)
    expect(inputSpy).not.toHaveBeenCalled()
  })
  it('should return the selected environment', async () => {
    await expect(getUrl('', testName)).resolves.toEqual(testUrl)
    expect(inputSpy).toHaveBeenCalled()
  })
})

describe('getLoginMethod()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should resolve to oauth-admin', async () => {
    await expect(
      getLoginMethod({
        web: false,
        admin: true,
        token: false,
      }),
    ).resolves.toEqual('oauth-admin')
  })
  it('should resolve to oauth', async () => {
    await expect(
      getLoginMethod({
        web: true,
        admin: false,
        token: false,
      }),
    ).resolves.toEqual('oauth')
  })
  it('should resolve to token', async () => {
    await expect(
      getLoginMethod({
        web: false,
        admin: false,
        token: 'token',
      }),
    ).resolves.toEqual('token')
  })
  it('should resolve to token-prompt', async () => {
    await expect(
      getLoginMethod({
        web: false,
        admin: false,
        token: true,
      }),
    ).resolves.toEqual('token-prompt')
  })
  it('should resolve to oauth (after prompt)', async () => {
    const selectSpy = jest.spyOn(yp, 'select').mockResolvedValue('oauth')

    await expect(
      getLoginMethod({
        web: false,
        admin: false,
        token: false,
      }),
    ).resolves.toEqual('oauth')
    expect(selectSpy).toHaveBeenCalled()
  })
  it('should resolve to token-prompt (after prompt)', async () => {
    const selectSpy = jest.spyOn(yp, 'select').mockResolvedValue('token-prompt')

    await expect(
      getLoginMethod({
        web: false,
        admin: false,
        token: false,
      }),
    ).resolves.toEqual('token-prompt')
    expect(selectSpy).toHaveBeenCalled()
  })
})

describe('loginAndCreateEnv()', () => {
  const originalEnv = process.env
  let writeFileSyncSpy: any
  let inputSpy: any
  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testEnvs))
    jest
      .spyOn(OAuthClient.prototype, 'login')
      .mockResolvedValue(testLoginResponse)
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')
    inputSpy = jest.spyOn(yp, 'input').mockResolvedValue('token')
  })
  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })
  it('should create environment after oauth login', async () => {
    jest.spyOn(OAuthClient.prototype, 'connect').mockResolvedValue()

    await loginAndCreateEnv('oauth', testName, testUrl, false)

    expect(writeFileSyncSpy).toHaveBeenCalled()
  })
  it('should fail at the oauth login', async () => {
    jest
      .spyOn(OAuthClient.prototype, 'connect')
      .mockRejectedValue(Error(errorMsg))

    await expect(
      loginAndCreateEnv('oauth', testName, testUrl, false),
    ).rejects.toThrow(
      Error(`OAuth login failed! Please try again.\nError was: ${errorMsg}`),
    )
    expect(writeFileSyncSpy).not.toHaveBeenCalled()
  })
  it('should create environment after oauth-admin login', async () => {
    jest.spyOn(OAuthClient.prototype, 'connect').mockResolvedValue()

    await loginAndCreateEnv('oauth-admin', testName, testUrl, false)

    expect(writeFileSyncSpy).toHaveBeenCalled()
  })
  it('should fail at the oauth-admin login', async () => {
    jest
      .spyOn(OAuthClient.prototype, 'connect')
      .mockRejectedValue(Error(errorMsg))

    await expect(
      loginAndCreateEnv('oauth-admin', testName, testUrl, false),
    ).rejects.toThrow(Error(oauthErrorMsg))
    expect(writeFileSyncSpy).not.toHaveBeenCalled()
  })
  it('should create environment after token-prompt login', async () => {
    jest
      .spyOn(ApiClient.prototype, 'listNewTokens')
      .mockResolvedValue([] as NewTokenMetadata[])

    await loginAndCreateEnv('token-prompt', testName, testUrl, false)
    expect(inputSpy).toHaveBeenCalled()
    expect(writeFileSyncSpy).toHaveBeenCalled()
  })
  it('should fail at the token-prompt login', async () => {
    jest
      .spyOn(ApiClient.prototype, 'listNewTokens')
      .mockRejectedValue(Error(errorMsg))

    await expect(
      loginAndCreateEnv('token-prompt', testName, testUrl, false),
    ).rejects.toThrow(
      Error(`Token login failed! Please try again.\nError was: ${errorMsg}`),
    )
    expect(inputSpy).toHaveBeenCalled()
    expect(writeFileSyncSpy).toHaveBeenCalled()
  })
})

describe('selectNamespaceAndUpdateEnv()', () => {
  const originalEnv = process.env
  let consoleLogSpy: any
  let consoleErrorSpy: any
  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      HOME: testEnvHome,
      RUNTIME_CONFIG: undefined,
    }
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testEnvs))
    jest.spyOn(fs, 'writeFileSync')
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {
      return
    })
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      return
    })
    jest.spyOn(process, 'exit').mockImplementation((number) => {
      throw new Error('process.exit: ' + number)
    })
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should update environment with provided namespace', async () => {
    const getNamespacesSpy = jest
      .spyOn(ApiClient.prototype, 'getNamespaces')
      .mockResolvedValue([{ id: 1 }] as Namespace[])

    await selectNamespaceAndUpdateEnv(testName, { namespace: 1 })

    expect(getNamespacesSpy).toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Updated 'namespace' to '1' for environment '${testName}'.`,
    )
  })
  it('should fail to update environment when provided namespace does not exist', async () => {
    jest
      .spyOn(ApiClient.prototype, 'getNamespaces')
      .mockResolvedValue([{ id: 2 }] as Namespace[])

    await expect(
      selectNamespaceAndUpdateEnv(testName, { namespace: 1 }),
    ).rejects.toThrow(Error('Namespace does not exist!'))
  })
  it('should update environment with selected namespace', async () => {
    const getNamespacesSpy = jest
      .spyOn(ApiClient.prototype, 'getNamespaces')
      .mockResolvedValue([{ id: 2 }] as Namespace[])
    const searchSpy = jest.spyOn(yp, 'search').mockResolvedValue('2')

    await selectNamespaceAndUpdateEnv(testName, { namespace: 0 })

    expect(getNamespacesSpy).toHaveBeenCalled()
    expect(searchSpy).toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Updated 'namespace' to '2' for environment '${testName}'.`,
    )
  })
  it('should fail to update environment when namespaces cannot be fetched', async () => {
    jest
      .spyOn(ApiClient.prototype, 'getNamespaces')
      .mockRejectedValue(Error(errorMsg))

    await expect(
      selectNamespaceAndUpdateEnv(testName, { namespace: 1 }),
    ).rejects.toThrow(Error('process.exit: 1'))

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red('Failed to get namespaces!'),
    )
  })
})
