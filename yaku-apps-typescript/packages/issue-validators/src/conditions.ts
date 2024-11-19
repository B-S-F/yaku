// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { CheckGeneralResult, InvalidResolvedValues, Issue } from './types.js'

/**
 * @param issues the list of all issues
 * @param fieldName the field to check for the issues
 * @param acceptedValues if the field has at least one of the accepted values, it is valid
 *
 * @returns a list of issues that don't have expected values
 */
export function checkExpectedValues(
  issues: Issue[],
  fieldName: string,
  acceptedValues: string[]
) {
  return issues.filter((issue) => {
    const field = issue[fieldName]
    if (!field) return false

    if (typeof field !== 'object') {
      return !acceptedValues.includes(field)
    } else {
      for (const property in field) {
        if (acceptedValues.includes(field[property])) return false
      }
      return true
    }
  })
}

/**
 * @param issues the list of all issues
 * @param fieldName the field to check for the issues
 * @param acceptedValues if the field has at least one of the accepted values, it is valid
 *
 * @returns a list of issues that have expected values
 */
export function checkExpectedValuesExist(
  issues: Issue[],
  fieldName: string,
  acceptedValues: string[]
) {
  return issues.filter((issue) => {
    const field = issue[fieldName]
    if (!field) return false

    if (typeof field !== 'object') {
      return acceptedValues.includes(field)
    } else {
      for (const property in field) {
        if (acceptedValues.includes(field[property])) return true
      }
      return false
    }
  })
}

/**
 * @param issues the list of all issues
 * @param fieldName the field to check for the issues
 * @param unacceptedValues the values that are not accepted for that field
 *
 * @returns a list of issues with unaccepted field values
 */
export const checkIllegalValuesExist = checkExpectedValuesExist

/**
 * @param issues the list of all issues
 * @param fieldName the field to check for the issues
 * @param unacceptedValues the illegal values that are not accepted for that field
 *
 * @returns a list of issues without unaccepted field values
 */
export const checkIllegalValues = checkExpectedValues

/**
 * @param issue an issue object
 * @param dueDateFieldName the field name of the actual date of the issue
 *
 * @returns a `CheckGeneralResult` stating if the dueDate is defined, overdue or valid
 */
export const checkDueDate = (issue: Issue, dueDateFieldName: string) => {
  const dueDateField = issue[dueDateFieldName]
  if (!dueDateField) {
    return CheckGeneralResult.undefinedDueDate
  }

  const dueDate = new Date(String(dueDateField))
  if (dueDate < new Date(Date.now())) {
    return CheckGeneralResult.overdue
  }
  return CheckGeneralResult.valid
}

/**
 * @param issues the list of all issues
 * @param fieldName the field to check for the issues
 * @param acceptedValues if the field has at least one of the accepted values, it is valid
 * @param dueDateFieldName the field name of the actual date of the issue
 *
 * @returns an `InvalidResolvedValues` containing information about overdue or undefined due date items
 */
export function checkResolvedValues(
  issues: Issue[],
  fieldName: string,
  acceptedValues: string[],
  dueDateFieldName: string
): InvalidResolvedValues {
  const invalidissues: InvalidResolvedValues = {
    [CheckGeneralResult.undefinedDueDate]: [],
    [CheckGeneralResult.overdue]: [],
  }

  const issuesWithoutExpectedValue = checkExpectedValues(
    issues,
    fieldName,
    acceptedValues
  )
  issuesWithoutExpectedValue.forEach((issue: Issue) => {
    const response = checkDueDate(issue, dueDateFieldName)
    if (response !== CheckGeneralResult.valid) {
      console.log(issue)
      invalidissues[response].push(issue)
    }
  })

  return invalidissues
}

/**
 * @param issues the list of all issues
 * @param fieldName the field to check for the issues
 *
 * @returns a list of issues which don't have the specified field
 */
export function checkFieldNotExist(issues: Issue[], fieldName: string) {
  return issues.filter((issue) => !issue[fieldName])
}

export function checkFieldExists(issues: Issue[], fieldName: string) {
  return issues.filter((issue) => issue[fieldName])
}
