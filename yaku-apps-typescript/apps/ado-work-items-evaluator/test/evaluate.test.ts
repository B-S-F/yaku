// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as evaluator from '../src/evaluate'
import { WorkItemsConfig } from '../src/types.js'

const workItems = [
  {
    title: 'Work Item 1',
    id: 1,
    url: 'url1',
    state: 'Open',
    assignedTo: 'Name 1',
    dueDate: '2022.01.02',
    relations: [],
  },
  {
    title: 'Work Item 2',
    id: 2,
    url: 'url2',
    state: 'Closed',
    assignedTo: 'Name 2',
    dueDate: '2022.02.02',
    relations: [],
  },
]

const fields = {
  state: {
    fieldName: 'state',
    conditions: {
      resolved: ['Closed'],
    },
  },
  assignee: {
    fieldName: 'assignedTo',
    conditions: {
      expected: ['name'],
    },
    closedAfterDate: '2022.01.02',
  },
}

const stateFieldName = 'state'
const closedStates = ['closed']
const dueDateFieldName = 'dueDate'

describe('initializeInvalidWorkItemsField()', () => {
  it("should initialize the field's dictionary with all condition types", () => {
    const invalidIssues = {}
    const expectedObject = {
      state: {
        exists: [],
        expected: [],
        illegal: [],
        resolved: {
          overdue: [],
          undefinedDueDate: [],
        },
      },
    }
    // doesn't exist yet
    evaluator.initializeInvalidWorkItemsField(invalidIssues, 'state')
    expect(invalidIssues).toEqual(expectedObject)
    // already exists
    evaluator.initializeInvalidWorkItemsField(invalidIssues, 'state')
    expect(invalidIssues).toEqual(expectedObject)
  })
})
describe('checkWorkItems()', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('should return invalid work items', () => {
    const result = evaluator.checkWorkItems(
      workItems,
      fields,
      stateFieldName,
      closedStates,
      dueDateFieldName
    )
    const expectedResult = {
      state: {
        exists: [],
        expected: [],
        illegal: [],
        resolved: { undefinedDueDate: [], overdue: [workItems[0]] },
      },
      assignee: {
        exists: [],
        expected: workItems,
        illegal: [],
        resolved: { overdue: [], undefinedDueDate: [] },
      },
    }
    expect(result).toEqual(expectedResult)
  })
})
describe('checkIfRelationExists()', () => {
  let items: any
  beforeEach(() => {
    items = structuredClone(workItems)
    items[0].relations.push('test')
  })
  it('should return a list of workItems with no relations', () => {
    const result = evaluator.checkIfRelationExists(items)
    expect(result.invalidWorkItems.length).toEqual(1)
  })
})

describe('checkWorkItemsRecursively()', () => {
  let items: any
  beforeEach(() => {
    items = structuredClone(workItems)
  })

  it('should return a result if data does not exist', () => {
    items = []
    const workItemsConfig: WorkItemsConfig = {
      evaluate: {
        checks: {
          dataExists: true,
        },
      },
    }
    const results = evaluator.checkWorkItemsRecursively(
      items,
      workItemsConfig,
      'dueDate',
      'state',
      ['Closed']
    )
    expect(results.length).toEqual(2)
    expect(results[0]).toEqual({
      criterion: 'work items in level 0 must be available',
      fulfilled: false,
      justification: 'There are no work items in level 0',
    })
  })

  it('should return a result if data exists', () => {
    const workItemsConfig: WorkItemsConfig = {
      evaluate: {
        checks: {
          dataExists: true,
        },
      },
    }
    const results = evaluator.checkWorkItemsRecursively(
      items,
      workItemsConfig,
      'dueDate',
      'state',
      ['Closed']
    )
    expect(results.length).toEqual(2)
    expect(results[0]).toEqual({
      criterion: 'work items in level 0 must be available',
      fulfilled: true,
      justification: 'There are 2 work items in level 0',
    })
  })

  it('should return a result if work items are not in cycle', () => {
    const workItemsConfig: WorkItemsConfig = {
      evaluate: {
        checks: {
          cycleInDays: 1,
        },
      },
    }
    const results = evaluator.checkWorkItemsRecursively(
      items,
      workItemsConfig,
      'dueDate',
      'state',
      ['Closed']
    )
    expect(results.length).toEqual(2)
    expect(results[0]).toEqual({
      criterion: 'work items in level 0 must be in cycle',
      fulfilled: false,
      justification: 'There are work items in level 0 that are not in cycle',
    })
  })

  it('should return a result if work items are in cycle', () => {
    const workItemsConfig: WorkItemsConfig = {
      evaluate: {
        checks: {
          cycleInDays: 10000,
        },
      },
    }
    const results = evaluator.checkWorkItemsRecursively(
      items,
      workItemsConfig,
      'dueDate',
      'state',
      ['Closed']
    )
    expect(results.length).toEqual(2)
    expect(results[0]).toEqual({
      criterion: 'work items in level 0 must be in cycle',
      fulfilled: true,
      justification: 'All work items in level 0 are in cycle',
    })
  })

  it('should return a result if relations do not exist', () => {
    const workItemsConfig: WorkItemsConfig = {
      evaluate: {
        checks: {
          relationsExists: true,
        },
      },
    }
    const results = evaluator.checkWorkItemsRecursively(
      items,
      workItemsConfig,
      'dueDate',
      'state',
      ['Closed']
    )
    expect(results.length).toEqual(2)
    expect(results[0]).toEqual({
      criterion: 'work items in level 0 must have relations',
      fulfilled: false,
      justification: 'There are 2 work items in level 0 that have no relations',
    })
  })

  it('should return a result if relations exist', () => {
    const workItemsConfig: WorkItemsConfig = {
      evaluate: {
        checks: {
          relationsExists: true,
        },
      },
    }
    items[0].relations.push('test')
    items[1].relations.push('test2')
    const results = evaluator.checkWorkItemsRecursively(
      items,
      workItemsConfig,
      'dueDate',
      'state',
      ['Closed']
    )
    expect(results.length).toEqual(2)
    expect(results[0]).toEqual({
      criterion: 'work items in level 0 must have relations',
      fulfilled: true,
      justification: 'All work items in level 0 have relations',
    })
  })
  it('should return a result if a work items DOES NOT satisfy any of the conditions', () => {
    const workItems = [
      {
        title: 'Work Item 1',
        id: 1,
        url: 'https://dev.azure.com/test/test/_workitems/1',
        State: 'Open',
        assigned: 'test1',
      },
      {
        title: 'Work Item 2',
        id: 2,
        url: 'https://dev.azure.com/test/test/_workitems/2',
        State: 'Closed',
        AssignedTo: 'test2',
      },
    ]
    const workItemsConfig: WorkItemsConfig = {
      evaluate: {
        checks: {
          fields: {
            assigned: {
              fieldName: 'assigned',
              conditions: {
                expected: ['test1'],
              },
            },
          },
        },
      },
    }
    const results = evaluator.checkWorkItemsRecursively(
      workItems,
      workItemsConfig,
      'dueDate',
      'state',
      ['Closed']
    )
    expect(results.length).toEqual(1)
    expect(results[0]).toEqual({
      criterion:
        "The work item [(2) Work Item 2] must satisfy any of the conditions ''",
      fulfilled: false,
      justification:
        'The work item [(2) Work Item 2] does not satisfy any provided condition',
      metadata: {
        field: 'assigned',
        id: 2,
        title: 'Work Item 2',
        url: 'https://dev.azure.com/test/test/_workitems/2',
      },
    })
  })
  it('should return a result if any of the work items DOES NOT have one of the enumerated values in expected condition', () => {
    const workItems = [
      {
        title: 'Work Item 1',
        id: 1,
        url: 'https://dev.azure.com/test/test/_workitems/1',
        State: 'Open',
        assigned: 'test1',
      },
      {
        title: 'Work Item 2',
        id: 2,
        url: 'https://dev.azure.com/test/test/_workitems/2',
        State: 'Closed',
        assigned: 'test2',
      },
    ]
    const workItemsConfig: WorkItemsConfig = {
      evaluate: {
        checks: {
          fields: {
            assigned: {
              fieldName: 'assigned',
              conditions: {
                expected: ['test1'],
              },
            },
          },
        },
      },
    }
    const results = evaluator.checkWorkItemsRecursively(
      workItems,
      workItemsConfig,
      'dueDate',
      'state',
      ['Closed']
    )
    expect(results.length).toEqual(1)
    expect(results[0]).toEqual({
      criterion:
        "The work item [(2) Work Item 2] must have '?' value in field 'assigned'",
      fulfilled: false,
      justification:
        "The work item [(2) Work Item 2] has a wrong value 'test2' in field 'assigned'",
      metadata: {
        field: 'assigned',
        id: 2,
        title: 'Work Item 2',
        url: 'https://dev.azure.com/test/test/_workitems/2',
      },
    })
  })
  it('should return no result if all of the work items have one of the enumerated values in expected condition', () => {
    const workItems = [
      {
        title: 'Work Item 1',
        id: 1,
        url: 'https://dev.azure.com/test/test/_workitems/1',
        State: 'Open',
        assigned: 'test1',
      },
      {
        title: 'Work Item 2',
        id: 2,
        url: 'https://dev.azure.com/test/test/_workitems/2',
        State: 'Closed',
        assigned: 'test2',
      },
    ]
    const workItemsConfig: WorkItemsConfig = {
      evaluate: {
        checks: {
          fields: {
            assigned: {
              fieldName: 'assigned',
              conditions: {
                expected: ['test1', 'test2'],
              },
            },
          },
        },
      },
    }
    const results = evaluator.checkWorkItemsRecursively(
      workItems,
      workItemsConfig,
      'dueDate',
      'state',
      ['Closed']
    )
    expect(results.length).toEqual(0)
  })
  it('should return a result if any of the issues DOES have one of the given values in illegal condition', () => {
    const workItems = [
      {
        title: 'Work Item 1',
        id: 1,
        url: 'https://dev.azure.com/test/test/_workitems/1',
        State: 'Open',
        assigned: 'test1',
      },
      {
        title: 'Work Item 2',
        id: 2,
        url: 'https://dev.azure.com/test/test/_workitems/2',
        State: 'Closed',
        assigned: 'test2',
      },
    ]
    const workItemsConfig: WorkItemsConfig = {
      evaluate: {
        checks: {
          fields: {
            assigned: {
              fieldName: 'assigned',
              conditions: {
                illegal: ['test1'],
              },
            },
          },
        },
      },
    }
    const results = evaluator.checkWorkItemsRecursively(
      workItems,
      workItemsConfig,
      'dueDate',
      'state',
      ['Closed']
    )
    expect(results.length).toEqual(1)
    expect(results[0]).toEqual({
      criterion:
        "The work item [(1) Work Item 1] must not have '?' value in field 'assigned'",
      fulfilled: false,
      justification:
        "The work item [(1) Work Item 1] has a wrong value 'test1' in field 'assigned'",
      metadata: {
        field: 'assigned',
        id: 1,
        title: 'Work Item 1',
        url: 'https://dev.azure.com/test/test/_workitems/1',
      },
    })
  })
  it('should return no result if all of the work items have none of the given values in illegal condition', () => {
    const workItems = [
      {
        title: 'Work Item 1',
        id: 1,
        url: 'https://dev.azure.com/test/test/_workitems/1',
        State: 'Open',
        assigned: 'test1',
      },
      {
        title: 'Work Item 2',
        id: 2,
        url: 'https://dev.azure.com/test/test/_workitems/2',
        State: 'Closed',
        assigned: 'test2',
      },
    ]
    const workItemsConfig: WorkItemsConfig = {
      evaluate: {
        checks: {
          fields: {
            assigned: {
              fieldName: 'assigned',
              conditions: {
                illegal: ['test3'],
              },
            },
          },
        },
      },
    }
    const results = evaluator.checkWorkItemsRecursively(
      workItems,
      workItemsConfig,
      'dueDate',
      'state',
      ['Closed']
    )
    expect(results.length).toEqual(0)
  })
  it('should return a result if a work item is Open and its due date is in the past', () => {
    const workItems = [
      {
        title: 'Work Item 1',
        id: 1,
        url: 'https://dev.azure.com/test/test/_workitems/1',
        state: 'Open',
        dueDate: '2020-01-01',
      },
      {
        title: 'Work Item 2',
        id: 2,
        url: 'https://dev.azure.com/test/test/_workitems/2',
        state: 'Closed',
        dueDate: '2020-01-01',
      },
      {
        title: 'Work Item 3',
        id: 3,
        url: 'https://dev.azure.com/test/test/_workitems/2',
        state: 'Open',
      },
    ]
    const workItemsConfig: WorkItemsConfig = {
      evaluate: {
        settings: {
          dueDateFieldName: 'dueDate',
        },
        checks: {
          fields: {
            state: {
              fieldName: 'state',
              conditions: {
                resolved: ['Closed'],
              },
            },
          },
        },
      },
    }

    const results = evaluator.checkWorkItemsRecursively(
      workItems,
      workItemsConfig,
      'dueDate',
      'state',
      ['Closed']
    )
    expect(results.length).toEqual(2)
    expect(results[1]).toEqual({
      criterion: 'The work item [(1) Work Item 1] must be resolved',
      fulfilled: false,
      justification:
        'The work item [(1) Work Item 1] was not resolved before its due date 2020-01-01',
      metadata: {
        id: 1,
        title: 'Work Item 1',
        url: 'https://dev.azure.com/test/test/_workitems/1',
        dueDateField: 'dueDate',
      },
    })
    expect(results[0]).toEqual({
      criterion: 'The work item [(3) Work Item 3] must be resolved',
      fulfilled: false,
      justification:
        'The work item [(3) Work Item 3] has no due date field dueDate',
      metadata: {
        id: 3,
        title: 'Work Item 3',
        url: 'https://dev.azure.com/test/test/_workitems/2',
        dueDateField: 'dueDate',
      },
    })
  })
})
