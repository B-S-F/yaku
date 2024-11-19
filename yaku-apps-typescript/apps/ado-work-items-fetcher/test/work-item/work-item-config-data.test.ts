// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, expect, afterEach, it, vi } from 'vitest'
import { WorkItemConfigData } from '../../src/work-item/work-item-config-data'

describe('WorkItemConfigData', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('getQuery() should return query', () => {
    const configData = new WorkItemConfigData({
      workItems: {
        query: 'query',
      },
    })
    expect(configData.getQuery()).eq('query')
  })

  it('getHierarchyDepth() should return hierarchyDepth', () => {
    const configData = new WorkItemConfigData({
      workItems: {
        hierarchyDepth: 1,
      },
    })
    expect(configData.getHierarchyDepth()).eq(1)
  })

  it('getHierarchyDepth() should return child hierarchyDepth', () => {
    const configData = new WorkItemConfigData({
      workItems: {
        relations: {
          get: true,
          relations: {
            get: true,
          },
        },
      },
    })
    expect(configData.getHierarchyDepth()).eq(2)
  })

  it('getRequestedFields() should return default fields', () => {
    const configData = new WorkItemConfigData({
      workItems: {
        neededFields: [],
      },
    })
    const result = configData.getRequestedFields()
    expect(result).toEqual(['state', 'title'])
  })

  it('getRequestedFields() should return default fields and needed fields', () => {
    const configData = new WorkItemConfigData({
      workItems: {
        neededFields: ['field1', 'field2'],
      },
    })
    const result = configData.getRequestedFields()
    expect(result).toEqual(['field1', 'field2', 'state', 'title'])
  })
  it('getRelationType() should return "any" if a relation has no relationType', () => {
    const configData = new WorkItemConfigData({
      workItems: {
        relations: {
          get: true,
        },
      },
    })
    const mockedGetHierarchyDepth = vi.spyOn(configData, 'getHierarchyDepth')
    mockedGetHierarchyDepth.mockReturnValueOnce(1)
    const result = configData.getRelationType(1)
    expect(result).toEqual('any')
  })
  it('getRelationType() should return "any" if there is no relation', () => {
    const configData = new WorkItemConfigData({
      workItems: {},
    })
    const mockedGetHierarchyDepth = vi.spyOn(configData, 'getHierarchyDepth')
    mockedGetHierarchyDepth.mockReturnValueOnce(0)
    const result = configData.getRelationType(0)
    expect(result).toEqual('any')
  })
  it('getRelationType() should return relationType of nested relations', () => {
    const configData = new WorkItemConfigData({
      workItems: {
        relations: {
          get: true,
          relationType: 'Child',
          relations: {
            get: true,
            relationType: 'Related',
          },
        },
      },
    })
    const mockedGetHierarchyDepth = vi.spyOn(configData, 'getHierarchyDepth')
    mockedGetHierarchyDepth.mockReturnValue(2)
    const result1 = configData.getRelationType(1)
    expect(result1).toEqual('Related')
    const result2 = configData.getRelationType(2)
    expect(result2).toEqual('Child')
  })
})
