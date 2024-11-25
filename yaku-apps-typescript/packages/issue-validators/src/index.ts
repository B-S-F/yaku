// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import {
  checkFieldNotExist,
  checkFieldExists,
  checkExpectedValues,
  checkExpectedValuesExist,
  checkIllegalValues,
  checkIllegalValuesExist,
  checkResolvedValues,
} from './conditions.js'
import { Issue, InvalidResolvedValues, Conditions } from './types.js'

/**
 * @param issues the list of all issues
 * @param fieldName the field to check for the issues
 * @param acceptedValues if the field has at least one of the accepted values, it is performed
 * @param days the number of days in a cycle
 * @param dueDateFieldName the field name of the actual date of the issue
 *
 * @returns a `CheckGeneralResult` stating if the the latest issue date is still before the cycle or not
 */
export const checkInCycle = (
  issues: Issue[],
  fieldName: string,
  acceptedValues: string[],
  days: number,
  dueDateFieldName: string,
) => {
  acceptedValues = acceptedValues.map((value) => value.toLowerCase())
  const validIssues = issues.filter((issue) =>
    acceptedValues.includes(issue[fieldName].toLowerCase()),
  )

  if (validIssues.length === 0) return false

  const dates = validIssues.map((issue) => new Date(issue[dueDateFieldName]))
  const mostRecentDate: Date = new Date(
    Math.max(...dates.map((d) => d.getTime())),
  )

  const cycleStartDate = new Date()
  cycleStartDate.setDate(cycleStartDate.getDate() - days)
  if (mostRecentDate < cycleStartDate) {
    return false
  }
  return true
}

/**
 * @param issues the list of all issues
 * @param fieldName the field to check for the issues
 * @param acceptedValues if the field has at least one of the accepted values, it is performed
 * @param dueDateFieldName the field name of the actual date of the issue
 * @param afterDate the date after which to take issues into consideration
 *
 * @returns a list of issues that are either not closed, or after afterDate
 */
export const checkClosedIssuesAfterDate = (
  issues: Issue[],
  fieldName: string,
  acceptedValues: string[],
  dueDateFieldName: string,
  afterDate?: Date,
) => {
  if (afterDate && dueDateFieldName) {
    return issues.filter((issue) => {
      const isClosed = acceptedValues.includes(issue[fieldName])
      let dueDate
      if (issue[dueDateFieldName]) dueDate = new Date(issue[dueDateFieldName])

      if (
        !isClosed ||
        (isClosed && dueDate && dueDate > afterDate) ||
        (isClosed && !dueDate) // keep closed issues without due date
      )
        return issue
    })
  }
  return issues
}

/**
 * @param issues the list of all issues
 * @param fieldName the field to check for the issues
 * @param conditionType the condition to check
 * @param values the list of elements to check the issues against
 * @param params additional information required for the check
 *
 * @returns the value of the chosen condition check
 */
export const checkProperty = (
  returnValidIssues = false,
  issues: Issue[],
  fieldName: string,
  conditionType: Conditions,
  values?: string[],
  dueDateFieldName?: string,
): Issue[] | InvalidResolvedValues => {
  switch (conditionType) {
    case Conditions.exists:
      if (returnValidIssues == false) {
        return checkFieldNotExist(issues, fieldName)
      } else {
        return checkFieldExists(issues, fieldName)
      }
    case Conditions.expected:
      if (returnValidIssues == false) {
        return checkExpectedValues(issues, fieldName, values!)
      } else {
        return checkExpectedValuesExist(issues, fieldName, values!)
      }
    case Conditions.illegal:
      if (returnValidIssues == false) {
        return checkIllegalValuesExist(issues, fieldName, values!)
      } else {
        return checkIllegalValues(issues, fieldName, values!)
      }
    case Conditions.resolved:
      return checkResolvedValues(issues, fieldName, values!, dueDateFieldName!)
    default:
      console.warn(`Condition ${conditionType} is not implemented!`)
  }

  return []
}

export * from './types.js'
export * from './conditions.js'
export * from './output.js'
