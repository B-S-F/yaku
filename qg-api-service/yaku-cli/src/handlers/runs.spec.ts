// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { jest } from '@jest/globals'
import {
  listRuns,
  showRun,
  getRunEnvironment,
  createRun,
  getRunResult,
  getRunEvidences,
  deleteRun,
} from './runs'
import { ApiClient, Run, RunPaginated } from '@B-S-F/yaku-client-lib'
import { Command } from 'commander'

const testApiClient = new ApiClient({
  baseUrl: 'http://base.url',
  token: 'token',
})
const testNamespaceId = 1

describe('listRuns()', () => {
  let listRunsSpy: any
  let listAllRunsSpy: any
  beforeEach(() => {
    listRunsSpy = jest
      .spyOn(ApiClient.prototype, 'listRuns')
      .mockResolvedValue({} as RunPaginated)
    listAllRunsSpy = jest
      .spyOn(ApiClient.prototype, 'listAllRuns')
      .mockResolvedValue([])
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.listRuns() without options', async () => {
    await listRuns(testApiClient, testNamespaceId, '', {})

    expect(listRunsSpy).toHaveBeenCalledWith(1, {
      ascending: false,
      filterProperty: [],
      filterValues: [],
      itemCount: 20,
      page: 1,
    })
  })
  it('should call ApiClient.listRuns() with options', async () => {
    await listRuns(testApiClient, testNamespaceId, '2', {
      itemCount: '10',
      filterBy: 'property=value1,value2',
      sortBy: 'sortBy',
      latestOnly: true,
    })

    expect(listRunsSpy).toHaveBeenCalledWith(1, {
      ascending: false,
      filterProperty: ['property', 'latestOnly'],
      filterValues: [['value1', 'value2'], ['true']],
      itemCount: 10,
      page: 2,
      sortBy: 'sortBy',
    })
  })
  it('should call ApiClient.listAllRuns()', async () => {
    await listRuns(testApiClient, testNamespaceId, '', { all: true })

    expect(listAllRunsSpy).toHaveBeenCalled()
  })
})

describe('showRun()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.getRun()', async () => {
    const getRunSpy = jest
      .spyOn(ApiClient.prototype, 'getRun')
      .mockResolvedValue({} as Run)

    await showRun(testApiClient, testNamespaceId, '1', {})

    expect(getRunSpy).toHaveBeenCalled()
  })
})

describe('getRunEnvironment()', () => {
  const testCommand = {
    error: function (errorMsg: string) {
      throw Error(errorMsg)
    },
  } as Command
  it('should return empty run environment when no options are provided', () => {
    const result = getRunEnvironment(testCommand, {})

    expect(result).toEqual({})
  })
  it('should return run environment when options are provided correctly', () => {
    const result = getRunEnvironment(testCommand, {
      environment: ['key1', 'value1'],
    })

    expect(result).toEqual({ key1: 'value1' })
  })
  it('should fail to complete when options are in the wrong format', () => {
    expect(() => {
      getRunEnvironment(testCommand, { environment: ['key1'] })
    }).toThrow(
      Error(
        'Error: You provided additional environment variables but in the wrong format. Correct: KEY1 VALUE1 KEY2 VALUE2 ...'
      )
    )
  })
  it('should fail to complete when provided key is empty', () => {
    expect(() => {
      getRunEnvironment(testCommand, { environment: ['', ''] })
    }).toThrow(
      Error('Error: You provided an environment variable with an empty key')
    )
  })
})

describe('createRun()', () => {
  let startRunSpy: any
  let startAndAwaitRunSpy: any
  beforeEach(() => {
    startRunSpy = jest
      .spyOn(ApiClient.prototype, 'startRun')
      .mockResolvedValue({} as Run)
    startAndAwaitRunSpy = jest
      .spyOn(ApiClient.prototype, 'startAndAwaitRun')
      .mockResolvedValue({} as Run)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.startRun()', async () => {
    await createRun(testApiClient, testNamespaceId, '1', { details: true }, {})

    expect(startRunSpy).toHaveBeenCalled()
  })
  it('should call ApiClient.startAndAwaitRun()', async () => {
    await createRun(
      testApiClient,
      testNamespaceId,
      '1',
      { wait: true, pollInterval: '5' },
      {}
    )

    expect(startAndAwaitRunSpy).toHaveBeenCalled()
  })
})

describe('getRunResult()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.getRunResult()', async () => {
    const getRunResultSpy = jest
      .spyOn(ApiClient.prototype, 'getRunResult')
      .mockResolvedValue('')

    await getRunResult(testApiClient, testNamespaceId, '1')

    expect(getRunResultSpy).toHaveBeenCalled()
  })
})

describe('getRunEvidences()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.getRunEvidences()', async () => {
    const getRunEvidencesSpy = jest
      .spyOn(ApiClient.prototype, 'getRunEvidences')
      .mockResolvedValue('')

    await getRunEvidences(testApiClient, testNamespaceId, '1')

    expect(getRunEvidencesSpy).toHaveBeenCalled()
  })
})

describe('deleteRun()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.deleteRun()', async () => {
    const deleteRunSpy = jest
      .spyOn(ApiClient.prototype, 'deleteRun')
      .mockResolvedValue()

    await deleteRun(testApiClient, testNamespaceId, '1')

    expect(deleteRunSpy).toHaveBeenCalled()
  })
})
