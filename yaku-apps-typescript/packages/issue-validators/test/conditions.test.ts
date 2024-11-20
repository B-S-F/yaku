// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, expect, it, vi } from 'vitest'

import * as conditions from '../src/conditions'

const issues = [
  {
    State: 'Closed',
  },
  {
    State: {
      name: 'Closed',
      type: 'performed states',
    },
  },
  {
    State: {
      name: 'Open',
    },
  },
  {
    Id: 4,
  },
]
const fieldName = 'State'
const dueDateFieldName = 'DueDate'

describe('validators', () => {
  it("checkExpectedValues() should return issues which don't have the accepted values", () => {
    const acceptedValues = ['Closed']
    const expectedOutput = [issues[2]]
    const result = conditions.checkExpectedValues(
      issues,
      fieldName,
      acceptedValues,
    )
    expect(result).toEqual(expectedOutput)
  })
  it('checkExpectedValuesExist() should return issues which have the accepted values', () => {
    const acceptedValues = ['Closed']
    const expectedOutput = [issues[0], issues[1]]
    const result = conditions.checkExpectedValuesExist(
      issues,
      fieldName,
      acceptedValues,
    )
    expect(result).toEqual(expectedOutput)
  })
  it('checkIllegalValuesExist() should return issues which have illegal values', () => {
    const unacceptedValues = ['Open']
    const result = conditions.checkIllegalValuesExist(
      issues,
      fieldName,
      unacceptedValues,
    )
    const expectedOutput = [issues[2]]
    expect(result).toEqual(expectedOutput)
  })
  it('checkIllegalValues() should return issues which do not have illegal values', () => {
    const unacceptedValues = ['Open']
    const result = conditions.checkIllegalValues(
      issues,
      fieldName,
      unacceptedValues,
    )
    const expectedOutput = [issues[0], issues[1]]
    expect(result).toEqual(expectedOutput)
  })
  it('checkDueDate() should return undefined due date', () => {
    const issue = {}
    const result = conditions.checkDueDate(issue, dueDateFieldName)
    expect(result).toEqual('undefinedDueDate')
  })
  it('checkDueDate() should return overdue', () => {
    const issue = {
      DueDate: '2022-01-01',
    }
    const result = conditions.checkDueDate(issue, dueDateFieldName)
    expect(result).toEqual('overdue')
  })
  it('checkDueDate() should return overdue', () => {
    vi.useFakeTimers()
    const date = new Date('2022-01-01')
    vi.setSystemTime(date)
    const issue = {
      DueDate: '2022-02-01',
    }
    const result = conditions.checkDueDate(issue, dueDateFieldName)
    expect(result).toEqual('valid')
    vi.useRealTimers()
  })
  it('checkResolvedValues() should find a valid and an invalid issue', () => {
    const acceptedValues = ['Closed']
    const issuesResolved = [
      {
        State: 'Closed',
        DueDate: '2022-01-01',
      },
      {
        State: 'Open',
        DueDate: '2022-01-01',
      },
    ]
    const expectedResult = {
      undefinedDueDate: [],
      overdue: [issuesResolved[1]],
    }
    const result = conditions.checkResolvedValues(
      issuesResolved,
      fieldName,
      acceptedValues,
      dueDateFieldName,
    )
    expect(result).toEqual(expectedResult)
  })
  it('checkFieldNotExists() should return issues without the specified field', () => {
    const expectedResult = [issues[3]]
    const result = conditions.checkFieldNotExist(issues, fieldName)
    expect(result).toEqual(expectedResult)
  })
  it('checkFieldExists() should return issues with the specified field', () => {
    const expectedResult = [issues[0], issues[1], issues[2]]
    const result = conditions.checkFieldExists(issues, fieldName)
    expect(result).toEqual(expectedResult)
  })
})
