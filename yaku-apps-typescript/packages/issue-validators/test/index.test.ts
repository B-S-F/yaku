/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import { describe, expect, it, vi } from 'vitest'
import { Conditions } from '../src/types.js'
import * as evaluators from '../src/index'

const fieldName = 'State'
const dueDateFieldName = 'DueDate'
const acceptedValues = ['Closed']

describe('checkInCycle()', () => {
  const issues = [
    {
      Id: 1,
      State: 'Closed',
      DueDate: '2022-01-01',
    },
    {
      Id: 2,
      State: 'Open',
      DueDate: '2022-02-01',
    },
  ]
  const days = 30

  it('should return false if all issues are invalid', () => {
    const result = evaluators.checkInCycle(
      [],
      fieldName,
      acceptedValues,
      days,
      dueDateFieldName,
    )
    expect(result).toBeFalsy()
  })

  it('should return false', () => {
    vi.useFakeTimers()
    const date = new Date('2022-03-01')
    vi.setSystemTime(date)
    const result = evaluators.checkInCycle(
      issues,
      fieldName,
      acceptedValues,
      days,
      dueDateFieldName,
    )
    expect(result).toBeFalsy()
    vi.useRealTimers()
  })

  it('should return true', () => {
    vi.useFakeTimers()
    const date = new Date('2022-01-30')
    vi.setSystemTime(date)
    const result = evaluators.checkInCycle(
      issues,
      fieldName,
      acceptedValues,
      days,
      dueDateFieldName,
    )
    expect(result).toBeTruthy()
    vi.useRealTimers()
  })
})

describe('checkClosedIssuesAfterDate()', () => {
  const issues = [
    {
      Id: 1,
      State: 'Closed',
    },
    {
      Id: 2,
      State: 'Open',
    },
    {
      Id: 3,
      State: 'Closed',
      DueDate: '2022-01-01',
    },
    {
      Id: 4,
      State: 'Closed',
      DueDate: '2021-12-30',
    },
  ]
  it('should return all issues because of no date', () => {
    const result = evaluators.checkClosedIssuesAfterDate(
      issues,
      fieldName,
      acceptedValues,
      dueDateFieldName,
    )
    expect(result).toEqual(issues)
  })
  it('should return open issues, closed issues after date, closed issues without date', () => {
    const afterDate = new Date('2021-12-31')
    const result = evaluators.checkClosedIssuesAfterDate(
      issues,
      fieldName,
      acceptedValues,
      dueDateFieldName,
      afterDate,
    )
    expect(result).toEqual(issues.slice(0, 3))
  })
})

describe('checkProperty()', () => {
  it('should return empty array for unknown condition type', () => {
    const conditionType = 'condition1' as Conditions
    const mockedConsole = vi.spyOn(console, 'warn')
    const result = evaluators.checkProperty(
      false,
      [],
      fieldName,
      conditionType,
      acceptedValues,
    )
    expect(result).toEqual([])
    expect(mockedConsole).toHaveBeenCalledWith(
      'Condition condition1 is not implemented!',
    )
  })
  it('should return issues with undefined fields', () => {
    const issues = [
      {
        Id: 1,
      },
    ]
    const conditionType = 'exists' as Conditions
    const expectedResult = issues
    const result = evaluators.checkProperty(
      false,
      issues,
      fieldName,
      conditionType,
      acceptedValues,
    )
    expect(result).toEqual(expectedResult)
  })
  it('should return issues with unexpected fields', () => {
    const issues = [
      {
        Id: 1,
        State: 'Open',
      },
    ]
    const conditionType = 'expected' as Conditions
    const expectedResult = issues
    const result = evaluators.checkProperty(
      false,
      issues,
      fieldName,
      conditionType,
      acceptedValues,
    )
    expect(result).toEqual(expectedResult)
  })
  it('should return issues with expected fields', () => {
    const issues = [
      {
        Id: 1,
        State: 'Closed',
      },
    ]
    const conditionType = 'expected' as Conditions
    const expectedResult = issues
    const result = evaluators.checkProperty(
      true,
      issues,
      fieldName,
      conditionType,
      acceptedValues,
    )
    expect(result).toEqual(expectedResult)
  })
  it('should return issues with illegal fields', () => {
    const issues = [
      {
        Id: 1,
        State: 'Closed',
      },
    ]
    const conditionType = 'illegal' as Conditions
    const expectedResult = issues
    const result = evaluators.checkProperty(
      false,
      issues,
      fieldName,
      conditionType,
      acceptedValues,
    )
    expect(result).toEqual(expectedResult)
  })
  it('should return issues without illegal fields', () => {
    const issues = [
      {
        Id: 1,
        State: 'Open',
      },
    ]
    const conditionType = 'illegal' as Conditions
    const expectedResult = issues
    const result = evaluators.checkProperty(
      true,
      issues,
      fieldName,
      conditionType,
      acceptedValues,
    )
    expect(result).toEqual(expectedResult)
  })
  it('should return issues with unresolved values', () => {
    const issues = [
      {
        Id: 1,
        State: 'Open',
      },
    ]
    const conditionType = 'resolved' as Conditions
    const expectedResult = {
      undefinedDueDate: issues,
      overdue: [],
    }
    const result = evaluators.checkProperty(
      false,
      issues,
      fieldName,
      conditionType,
      acceptedValues,
    )
    expect(result).toEqual(expectedResult)
  })
})
