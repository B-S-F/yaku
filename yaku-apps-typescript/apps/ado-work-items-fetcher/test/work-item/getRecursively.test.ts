// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHeaders, WorkItem } from '../../src/work-item/work-item'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    create: vi.fn(),
  },
}))

const headers = createHeaders('Test')
const configData = {
  getQuery: () => 'Test',
  getRequestedFields: () => ['Title'],
}
const workItemObject = new WorkItem(headers, axios, configData, {
  version: '6.0',
  wiql: '_apis/wit/wiql',
  url: 'https://dev.azure.com',
  org: 'ORG',
  project: 'PROJECT',
  personalAccessToken: 'TOKEN',
})

const mockValueRelations = [
  {
    id: 2,
    attributes: {
      name: 'Child',
    },
    url: 'https://child/url',
    relations: [],
  },
  {
    id: 3,
    attributes: {
      name: 'Child',
    },
    url: 'https://child/url',
    relations: [],
  },
]

const mockValueParent = {
  data: {
    id: 1,
    url: 'https://child/url',
    relations: [],
  },
}

const mockValue = JSON.parse(JSON.stringify(mockValueParent))
mockValue.data.relations = mockValueRelations

const mockedAxiosGet = vi.mocked(axios.get)

describe('WorkItem', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('getRecursively() should call axios.get with the correct url and headers', async () => {
    mockedAxiosGet.mockResolvedValueOnce(structuredClone(mockValue))
    const expectedUrl = 'https://parent/url?api-version=6.0&%24expand=relations'
    const expectedHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Basic OlRlc3Q=',
    }

    await workItemObject['getRecursively']('https://parent/url', 0)
    expect(axios.get).toHaveBeenCalledWith(expectedUrl, {
      headers: expectedHeaders,
    })
  })

  it('getRecursively() should return parent only', async () => {
    mockedAxiosGet.mockResolvedValueOnce(structuredClone(mockValue))

    const result = await workItemObject['getRecursively'](
      'https://parent/url',
      0
    )
    expect(result).toEqual(mockValueParent.data)
  })

  it('getRecursively() should return relations with relationType', async () => {
    mockedAxiosGet.mockResolvedValueOnce(structuredClone(mockValue))
    mockedAxiosGet.mockResolvedValueOnce({
      data: structuredClone(mockValueRelations[0]),
    })
    mockedAxiosGet.mockResolvedValueOnce({
      data: structuredClone(mockValueRelations[1]),
    })
    const expected = structuredClone(mockValue)
    expected.data.relations[0].relationType = 'Child'
    expected.data.relations[1].relationType = 'Child'

    const result = await workItemObject['getRecursively'](
      'https://parent/url',
      1
    )

    expect(result).toEqual(expected.data)
  })

  it('getRecursively() should return relations', async () => {
    mockedAxiosGet.mockResolvedValueOnce(structuredClone(mockValue))
    mockedAxiosGet.mockResolvedValueOnce({
      data: structuredClone(mockValueRelations[0]),
    })
    mockedAxiosGet.mockResolvedValueOnce({
      data: structuredClone(mockValueRelations[1]),
    })
    const expected = structuredClone(mockValue)
    expected.data.relations[0].relationType = 'Child'
    expected.data.relations[1].relationType = 'Child'

    const result = await workItemObject['getRecursively'](
      'https://parent/url',
      1
    )
    expect(result).toEqual(expected.data)
  })

  it('getRecursively() should return empty object when fetching fails', async () => {
    mockedAxiosGet.mockRejectedValueOnce(new Error('Test'))
    const result = await workItemObject['getRecursively'](
      'https://parent/url',
      0
    )
    expect(result).toEqual({})
  })
})
