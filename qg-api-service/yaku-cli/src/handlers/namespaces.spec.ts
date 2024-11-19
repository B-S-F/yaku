// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { jest } from '@jest/globals'
import {
  listNamespaces,
  switchNamespace,
  createNamespace,
  showNamespaces,
  updateNamespace,
  selectNamespace,
} from './namespaces'
import { ApiClient, Namespace } from '@B-S-F/yaku-client-lib'
import fs from 'fs'
import yp from '../yaku-prompts.js'
import chalk from 'chalk'
import { Environment } from './environment'

const testNamespaceId = '1'
const errorMsg = 'errorMsg'
const testEnvHome = '/tmp'
const testApiClient = new ApiClient({
  baseUrl: 'http://base.url',
  token: 'token',
})
const testEnvs: Environment[] = [
  {
    name: 'env1',
    url: 'http://dot.com',
    current: true,
    accessToken: 'at',
    namespace: Number(testNamespaceId),
  },
]

describe('selectNamespace()', () => {
  let consoleErrorSpy: any
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockReturnValue()
    jest.spyOn(yp, 'search').mockResolvedValue(testNamespaceId)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should fail to select a namespace from an empty list', async () => {
    expect(selectNamespace([])).resolves.toBe(undefined)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red('No namespaces available!'),
    )
  })
  it('should select the provided namespace', async () => {
    expect(
      selectNamespace([{ id: Number(testNamespaceId) }] as Namespace[]),
    ).resolves.toBe(testNamespaceId)
  })
})

describe('listNamespaces()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.getNamespaces()', async () => {
    const getNamespacesSpy = jest
      .spyOn(ApiClient.prototype, 'getNamespaces')
      .mockResolvedValue([])

    await listNamespaces(testApiClient)

    expect(getNamespacesSpy).toHaveBeenCalled()
  })
})

describe('switchNamespace()', () => {
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
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testEnvs))
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
  it('should fail to switch due to ApiClient error', async () => {
    jest
      .spyOn(ApiClient.prototype, 'getNamespaces')
      .mockRejectedValue(Error(errorMsg))

    await expect(
      switchNamespace(testApiClient, testNamespaceId),
    ).rejects.toThrow(Error('process.exit: 1'))

    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Error:\n  Message:       ${errorMsg}`,
    )
  })
  it('should fail to switch due to missing namespace', async () => {
    const missingNamespace = '2'
    jest
      .spyOn(ApiClient.prototype, 'getNamespaces')
      .mockResolvedValue([{ id: Number(testNamespaceId) }] as Namespace[])
    jest.spyOn(yp, 'search').mockResolvedValue(testNamespaceId)

    await switchNamespace(testApiClient, missingNamespace)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red(
        `Namespace with id ${missingNamespace} not found. Use 'namespaces list' to see available namespaces.`,
      ),
    )
  })
  it('should switch to the new namespace', async () => {
    jest
      .spyOn(ApiClient.prototype, 'getNamespaces')
      .mockResolvedValue([{ id: Number(testNamespaceId) }] as Namespace[])
    jest.spyOn(yp, 'search').mockResolvedValue(testNamespaceId)

    await switchNamespace(testApiClient, testNamespaceId)

    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Updated 'namespace' to '${testNamespaceId}' for environment '${testEnvs[0].name}'.`,
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `Switched to namespace with id ${testNamespaceId}`,
    )
    expect(writeFileSyncSpy).toHaveBeenCalled()
  })
})

describe('createNamespace()', () => {
  let consoleWarnSpy: any
  let createNamespaceSpy: any
  let createNamespaceWithConfigSpy: any
  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
      return
    })
    createNamespaceSpy = jest
      .spyOn(ApiClient.prototype, 'createNamespace')
      .mockResolvedValue({ id: Number(testNamespaceId) } as Namespace)
    createNamespaceWithConfigSpy = jest
      .spyOn(ApiClient.prototype, 'createNamespaceWithConfig')
      .mockResolvedValue({ id: Number(testNamespaceId) } as Namespace)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should warn about deprecation and call ApiClient.createNamespace()', async () => {
    await createNamespace(testApiClient, 'env1', ['u1'], {})

    expect(createNamespaceSpy).toHaveBeenCalled()
    expect(createNamespaceWithConfigSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalled()
  })
  it('should not warn about deprecation and call ApiClient.createNamespaceWithConfig()', async () => {
    await createNamespace(testApiClient, 'env1', [], { initConfigFile: true })

    expect(createNamespaceSpy).not.toHaveBeenCalled()
    expect(createNamespaceWithConfigSpy).toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })
})

describe('showNamespaces()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.getNamespace()', async () => {
    const getNamespaceSpy = jest
      .spyOn(ApiClient.prototype, 'getNamespace')
      .mockResolvedValue({ id: Number(testNamespaceId) } as Namespace)

    await showNamespaces(testApiClient, testNamespaceId)

    expect(getNamespaceSpy).toHaveBeenCalled()
  })
})

describe('updateNamespace', () => {
  let updateNamespaceSpy: any
  let consoleWarnSpy: any
  beforeEach(() => {
    updateNamespaceSpy = jest
      .spyOn(ApiClient.prototype, 'updateNamespace')
      .mockResolvedValue({ id: Number(testNamespaceId) } as Namespace)
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
      return
    })
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should not warn about deprecation and call ApiClient.updateNamespace()', async () => {
    await updateNamespace(testApiClient, testNamespaceId, {})

    expect(updateNamespaceSpy).toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })
  it('should warn about deprecation (twice) and call ApiClient.updateNamespace()', async () => {
    await updateNamespace(testApiClient, testNamespaceId, {
      users: ['u1'],
      mode: 'mode',
    })

    expect(updateNamespaceSpy).toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2)
  })
})
