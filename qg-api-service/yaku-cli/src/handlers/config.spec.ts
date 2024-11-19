// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { jest } from '@jest/globals'
import { ApiClient, Config, ConfigPaginated } from '@B-S-F/yaku-client-lib'
import yp from '../yaku-prompts.js'
import {
  listConfig,
  showConfig,
  createConfig,
  updateConfig,
  deleteConfig,
  makeConfig,
  excelConfig,
} from './configs'

const testApiClient = new ApiClient({
  baseUrl: 'http://base.url',
  token: 'token',
})
const testNamespace = 1

describe('listConfig()', () => {
  let listConfigsSpy: any
  let listAllConfigsSpy: any
  beforeEach(() => {
    listConfigsSpy = jest
      .spyOn(ApiClient.prototype, 'listConfigs')
      .mockResolvedValue({} as ConfigPaginated)
    listAllConfigsSpy = jest
      .spyOn(ApiClient.prototype, 'listAllConfigs')
      .mockResolvedValue([] as Config[])
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.listConfigs() when a page number is provided', async () => {
    await listConfig(testApiClient, testNamespace, '1', {})
    expect(listConfigsSpy).toHaveBeenCalled()
  })
  it('should call ApiClient.listConfigs() when itemCount is provided', async () => {
    await listConfig(testApiClient, testNamespace, '', {
      itemCount: '10',
    })
    expect(listConfigsSpy).toHaveBeenCalled()
  })
  it('should call ApiClient.listAllConfigs() when --all option is used', async () => {
    await listConfig(testApiClient, testNamespace, '', {
      all: true,
    })
    expect(listAllConfigsSpy).toHaveBeenCalled()
  })
})

describe('showConfig()', () => {
  let getConfigSpy: any
  beforeEach(() => {
    getConfigSpy = jest
      .spyOn(ApiClient.prototype, 'getConfig')
      .mockResolvedValue({} as Config)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.getConfig()', async () => {
    await showConfig(testApiClient, testNamespace, '1')
    expect(getConfigSpy).toHaveBeenCalled()
  })
})

describe('createConfig()', () => {
  let createConfigSpy: any
  beforeEach(() => {
    createConfigSpy = jest
      .spyOn(ApiClient.prototype, 'createConfig')
      .mockResolvedValue({} as Config)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.createConfig()', async () => {
    await createConfig(testApiClient, testNamespace, 'name', 'description')
    expect(createConfigSpy).toHaveBeenCalled()
  })
})

describe('updateConfig()', () => {
  let updateConfigSpy: any
  beforeEach(() => {
    updateConfigSpy = jest
      .spyOn(ApiClient.prototype, 'updateConfig')
      .mockResolvedValue({} as Config)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.updateConfig()', async () => {
    await updateConfig(testApiClient, testNamespace, '1', 'name', 'description')
    expect(updateConfigSpy).toHaveBeenCalled()
  })
})

describe('deleteConfig()', () => {
  let getConfigSpy: any
  let deleteConfigSpy: any
  beforeEach(() => {
    getConfigSpy = jest
      .spyOn(ApiClient.prototype, 'getConfig')
      .mockResolvedValue({} as Config)
    deleteConfigSpy = jest
      .spyOn(ApiClient.prototype, 'deleteConfig')
      .mockResolvedValue()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.deleteConfig() with -y option', async () => {
    await deleteConfig(testApiClient, testNamespace, '1', { yes: true })

    expect(getConfigSpy).not.toHaveBeenCalled()
    expect(deleteConfigSpy).toHaveBeenCalled()
  })
  it('should call ApiClient.getConfig() and ApiClient.deleteConfig() when user confirms', async () => {
    jest.spyOn(yp, 'confirm').mockResolvedValue(true)

    await deleteConfig(testApiClient, testNamespace, '1', {})

    expect(getConfigSpy).toHaveBeenCalled()
    expect(deleteConfigSpy).toHaveBeenCalled()
  })
  it('should call ApiClient.getConfig() but not ApiClient.deleteConfig() when user does not confirm', async () => {
    jest.spyOn(yp, 'confirm').mockResolvedValue(false)

    await deleteConfig(testApiClient, testNamespace, '1', {})

    expect(getConfigSpy).toHaveBeenCalled()
    expect(deleteConfigSpy).not.toHaveBeenCalled()
  })
})

describe('makeConfig()', () => {
  let createConfigFromQuestionnaireSpy: any
  beforeEach(() => {
    createConfigFromQuestionnaireSpy = jest
      .spyOn(ApiClient.prototype, 'createConfigFromQuestionnaire')
      .mockResolvedValue('')
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.createConfigFromQuestionnaire()', async () => {
    await makeConfig(testApiClient, testNamespace, '1', 'questionnaireFilepath')
    expect(createConfigFromQuestionnaireSpy).toHaveBeenCalled()
  })
})

describe('excelConfig()', () => {
  let createConfigFromExcelSpy: any
  beforeEach(() => {
    createConfigFromExcelSpy = jest
      .spyOn(ApiClient.prototype, 'createConfigFromExcel')
      .mockResolvedValue('')
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.createConfigFromExcel()', async () => {
    await excelConfig(
      testApiClient,
      testNamespace,
      '1',
      'xlsxFilepath',
      'configFilepath'
    )
    expect(createConfigFromExcelSpy).toHaveBeenCalled()
  })
})
