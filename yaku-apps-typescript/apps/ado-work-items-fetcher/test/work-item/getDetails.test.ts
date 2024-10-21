/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

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
const getRecursivelyResponse = {
  id: 1,
  url: 'https://child/url',
  relations: [
    {
      id: 2,
      attributes: {
        name: 'Child',
      },
      url: 'https://child/url',
    },
    {
      id: 3,
      attributes: {
        name: 'Child',
      },
      url: 'https://child/url',
    },
  ],
}

const referenceList = [
  {
    id: 1,
    url: 'https://child/url',
  },
  {
    id: 4,
    url: 'https://child/url',
  },
]

const expectedResult = [
  {
    id: 1,
    url: 'https://child/url',
    relations: [
      {
        id: 2,
        attributes: {
          name: 'Child',
        },
        url: 'https://child/url',
      },
      {
        id: 3,
        attributes: {
          name: 'Child',
        },
        url: 'https://child/url',
      },
    ],
  },
  {
    id: 1,
    url: 'https://child/url',
    relations: [
      {
        id: 2,
        attributes: {
          name: 'Child',
        },
        url: 'https://child/url',
      },
      {
        id: 3,
        attributes: {
          name: 'Child',
        },
        url: 'https://child/url',
      },
    ],
  },
]

describe('WorkItem', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('getDetails() should return work item details', async () => {
    const configData = {
      getHierarchyDepth: () => 2,
    }
    const workItem = new WorkItem(headers, axios, configData)
    const mockedGetRecursively = vi.spyOn(workItem as any, 'getRecursively')
    mockedGetRecursively.mockResolvedValue(getRecursivelyResponse)
    const result = await workItem['getDetails'](referenceList)
    expect(result).toEqual(expectedResult)
  })

  it('getDetails() should throw a Error', async () => {
    const configData = {
      getHierarchyDepth: () => 2,
    }
    const workItem = new WorkItem(headers, axios, configData)
    const mockedGetRecursively = vi.spyOn(workItem as any, 'getRecursively')
    mockedGetRecursively.mockRejectedValue(new Error('Error'))
    await expect(workItem['getDetails'](referenceList)).rejects.toThrow('Error')
  })
})
