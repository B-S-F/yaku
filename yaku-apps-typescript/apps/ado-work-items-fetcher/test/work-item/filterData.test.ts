// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import axios from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { createHeaders, WorkItem } from '../../src/work-item/work-item'

const headers = createHeaders('Test')
const configData = {
  getQuery: () => 'Test',
  getRequestedFields: () => ['title'],
  getHierarchyDepth: () => 1,
  getRelationType: () => 'Child',
}
const workItemObject = new WorkItem(headers, axios, configData)
const links = {
  html: {
    href: 'url',
  },
}

describe('WorkItem', () => {
  it('filterFields() should return only requested work item fields', () => {
    const workItemData = {
      id: 1,
      fields: {
        'Deployment.Id': 2,
        'Category.Custom.Title': 'Feature 1',
        status: 'Done',
        assignedTo: {
          displayName: 'Name',
          uniqueName: 'address@example.com',
        },
      },
      _links: links,
    }
    const neededFieldNames = ['Custom.Title', 'assignedTo', 'storyPoints']
    const spy = vi.spyOn(console, 'warn')
    const result = workItemObject['filterFields'](
      workItemData,
      neededFieldNames,
    )
    expect(result).toEqual({
      id: 1,
      url: 'url',
      'Custom.Title': 'Feature 1',
      assignedTo: {
        displayName: 'Name',
        uniqueName: 'address@example.com',
      },
    })
    expect(spy).toHaveBeenCalledWith(
      "The field 'storyPoints' is not available on work item with id 1",
    )
  })

  it('filterFieldsFromAllLevels() should return from all levels only requested fields', () => {
    const workItems = [
      {
        id: 1,
        fields: {
          title: 'Feature 1',
        },
        relations: [
          {
            id: 2,
            fields: {
              title: 'Task 1',
            },
            _links: links,
          },
        ],
        _links: links,
      },
    ]
    const neededFieldNames = ['title']
    const result = workItemObject['filterFieldsFromAllLevels'](
      workItems,
      neededFieldNames,
    )

    expect(result).toEqual([
      {
        id: 1,
        url: 'url',
        title: 'Feature 1',
        relations: [{ id: 2, url: 'url', title: 'Task 1' }],
      },
    ])
  })

  it('filterData() should return filtered fields according to config data', () => {
    const workItems = [
      {
        id: 1,
        fields: {
          title: 'Feature 1',
        },
        relations: [],
        _links: links,
      },
    ]

    const result = workItemObject['filterData'](workItems)
    expect(result).toEqual([
      { id: 1, url: 'url', title: 'Feature 1', relations: [] },
    ])
  })

  it('filterRelations() should return filtered relations according to config data', () => {
    const workItems = [
      {
        id: 1,
        title: 'Feature 1',
        url: 'url',
        relations: [
          {
            id: 2,
            url: 'url',
            title: 'Task 1',
            relationType: 'Child',
            relations: [],
          },
          {
            id: 3,
            url: 'url',
            title: 'Task 2',
            relationType: 'Related',
            relations: [],
          },
        ],
        _links: links,
      },
    ]

    const result = workItemObject['filterRelations'](workItems, 1, configData)
    expect(result).toEqual([
      {
        id: 1,
        url: 'url',
        title: 'Feature 1',
        _links: links,
        relations: [
          {
            id: 2,
            url: 'url',
            title: 'Task 1',
            relationType: 'Child',
            relations: [],
          },
        ],
      },
    ])
  })
})
