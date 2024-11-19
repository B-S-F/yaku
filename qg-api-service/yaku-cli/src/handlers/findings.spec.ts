// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { jest } from '@jest/globals'
import { listFindings, resolveFinding, reopenFinding } from './findings'
import { ApiClient, FindingsPaginated } from '@B-S-F/yaku-client-lib'

const testApiClient = new ApiClient({
  baseUrl: 'http://base.url',
  token: 'token',
})
const testNamespace = 1

describe('listFindings()', () => {
  let listFindingsSpy: any
  beforeEach(() => {
    listFindingsSpy = jest
      .spyOn(ApiClient.prototype, 'listFindings')
      .mockResolvedValue({} as FindingsPaginated)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.listFindings() with default options', async () => {
    await listFindings(testApiClient, testNamespace, '1', '', {})
    expect(listFindingsSpy).toHaveBeenCalledWith(1, {
      ascending: false,
      filterProperty: ['configId'],
      filterValues: [['1']],
      itemCount: 20,
      page: 1,
      sortBy: undefined,
    })
  })
  it('should call ApiClient.listFindings() with custom options', async () => {
    await listFindings(testApiClient, testNamespace, '1', '2', {
      itemCount: '5',
      filterBy: 'property=value1,value2',
      sortBy: 'sortBy',
      ascending: true,
    })
    expect(listFindingsSpy).toHaveBeenCalledWith(1, {
      ascending: true,
      filterProperty: ['property', 'configId'],
      filterValues: [['value1', 'value2'], ['1']],
      itemCount: 5,
      page: 2,
      sortBy: 'sortBy',
    })
  })
})

describe('resolveFindings()', () => {
  let resolveFindingSpy: any
  beforeEach(() => {
    resolveFindingSpy = jest
      .spyOn(ApiClient.prototype, 'resolveFinding')
      .mockResolvedValue()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.resolveFinding()', async () => {
    await resolveFinding(testApiClient, testNamespace, '1', {})
    expect(resolveFindingSpy).toHaveBeenCalled()
  })
})

describe('reopenFinding()', () => {
  let reopenFindingSpy: any
  beforeEach(() => {
    reopenFindingSpy = jest
      .spyOn(ApiClient.prototype, 'reopenFinding')
      .mockResolvedValue()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.reopenFinding()', async () => {
    await reopenFinding(testApiClient, testNamespace, '1')
    expect(reopenFindingSpy).toHaveBeenCalled()
  })
})
