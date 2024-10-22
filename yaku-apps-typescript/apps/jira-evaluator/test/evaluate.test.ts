import { describe, expect, it } from 'vitest'
import * as evaluator from '../src/evaluate'
import { AppError } from '@B-S-F/autopilot-utils'

const { initializeInvalidIssuesField } = evaluator.__t

describe('initializeInvalidIssuesField() ', () => {
  const field = {
    exists: [],
    expected: [],
    illegal: [],
  }
  it('should not do anything if field already exists', () => {
    const invalidIssues = { field }
    initializeInvalidIssuesField(invalidIssues, 'field')
    expect(invalidIssues).toEqual({
      field: {
        exists: [],
        expected: [],
        illegal: [],
      },
    })
  })
  it('should create empty array for each condition', () => {
    const invalidIssues = {}
    initializeInvalidIssuesField(invalidIssues, 'field')
    expect(invalidIssues).toEqual({ field })
  })
})

describe('checkIssues()', () => {
  it('should return the invalid issues for each field if AND condition not provided', () => {
    const config = {
      evaluate: {
        fields: {
          status: {
            fieldName: 'Status',
            conditions: {
              expected: ['Closed'],
            },
          },
          assignee: {
            fieldName: 'assignee',
            conditions: {
              illegal: ['USER-1'],
            },
          },
        },
      },
    }
    const issues = [
      {
        Id: 1,
        Status: 'Open',
        assignee: 'USER-2',
      },
      {
        Id: 2,
        Status: 'Closed',
        assignee: 'USER-1',
      },
    ]
    const expectedResult = {
      status: {
        exists: [],
        expected: [issues[0]],
        illegal: [],
      },
      assignee: {
        exists: [],
        expected: [],
        illegal: [issues[1]],
      },
    }
    const result = evaluator.checkIssues(issues, config)
    console.log(result)
    expect(result).toEqual(expectedResult)
  })

  it('should return the invalid issues with AND condition provided', () => {
    const config = {
      evaluate: {
        logic: 'AND',
        fields: {
          assignee: {
            fieldName: 'assignee',
            conditions: {
              expected: ['USER-1'],
            },
          },
          status: {
            fieldName: 'Status',
            conditions: {
              expected: ['Closed'],
            },
          },
        },
      },
    }
    const issues1 = [
      {
        Id: 1,
        Status: 'Closed',
        assignee: 'USER-1',
      },
    ]

    const expectedEmptyResult = {
      status: { exists: [], expected: [], illegal: [] },
      assignee: { exists: [], expected: [], illegal: [] },
    }

    const issues2 = [
      {
        Id: 1,
        Status: 'Closed',
        assignee: 'USER-1',
      },
      {
        Id: 2,
        Status: 'Open',
        assignee: 'USER-1',
      },
    ]
    const expectedResult2 = {
      assignee: {
        exists: [],
        expected: [],
        illegal: [],
      },
      status: {
        exists: [],
        expected: [issues2[1]],
        illegal: [],
      },
    }

    const issues3 = [
      {
        Id: 1,
        Status: 'Closed',
        assignee: 'USER-1',
      },
      {
        Id: 2,
        Status: 'Closed',
        assignee: 'USER-2',
      },
    ]

    const result1 = evaluator.checkIssues(issues1, config)
    expect(result1).toEqual(expectedEmptyResult)
    const result2 = evaluator.checkIssues(issues2, config)
    expect(result2).toEqual(expectedResult2)
    const result3 = evaluator.checkIssues(issues3, config)
    expect(result3).toEqual(expectedEmptyResult)
  })

  it('throws an error if an invalid logic keyword is provided in config', () => {
    const config = {
      evaluate: {
        logic: 'not-implemented',
        fields: {
          status: {
            fieldName: 'Status',
            conditions: {
              expected: ['Closed'],
            },
          },
          assignee: {
            fieldName: 'assignee',
            conditions: {
              expected: ['USER-1'],
            },
          },
        },
      },
    }
    const issues = [
      {
        Id: 1,
        Status: 'Closed',
        assignee: 'USER-1',
      },
      {
        Id: 2,
        Status: 'Open',
        assignee: 'USER-1',
      },
    ]
    expect(() => evaluator.checkIssues(issues, config)).toThrowError(AppError)
  })
})
