/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import {
  CheckGeneralResult,
  Conditions,
  InvalidIssues,
  InvalidResolvedValues,
  Issue,
  checkClosedIssuesAfterDate,
  checkInCycle,
  checkProperty,
} from '@B-S-F/issue-validators'

import { AppOutput, Result } from '@B-S-F/autopilot-utils'
import * as thisModule from './evaluate.js' // needed for testing
import { Config, Dictionary, WorkItemsConfig } from './types.js'

export function initializeInvalidWorkItemsField(
  invalidWorkItems: InvalidIssues,
  field: string
) {
  if (!invalidWorkItems[field]) {
    invalidWorkItems[field] = {
      exists: [],
      expected: [],
      illegal: [],
      resolved: {
        [CheckGeneralResult.overdue]: [],
        [CheckGeneralResult.undefinedDueDate]: [],
      },
    }
  }
}

export function checkWorkItems(
  workItems: Issue[],
  fields: Dictionary,
  stateFieldName: string,
  closedStates: string[],
  dueDateFieldName: string
): InvalidIssues {
  const invalidWorkItems: InvalidIssues = {}

  for (const field in fields) {
    const fieldValue = fields[field]
    const fieldName =
      fieldValue.fieldName.charAt(0).toLowerCase() +
      fieldValue.fieldName.slice(1)

    let workItemsToCheck: Issue[]

    if (fieldValue.closedAfterDate) {
      const closedAfterDate = new Date(fieldValue.closedAfterDate)
      workItemsToCheck = checkClosedIssuesAfterDate(
        workItems,
        stateFieldName,
        closedStates,
        dueDateFieldName,
        closedAfterDate
      )
    } else {
      workItemsToCheck = workItems
    }

    const conditions: Map<Conditions, string[]> = new Map<
      Conditions,
      string[]
    >()
    conditions.set(Conditions.exists, [])
    for (const [key, condition] of Object.entries(fieldValue.conditions)) {
      conditions.set(key as Conditions, condition as string[])
    }

    // TODO: use list from settings closedStates tag (see CLI generate)
    conditions.forEach((values, conditionType) => {
      const result = checkProperty(
        false,
        workItemsToCheck,
        fieldName,
        conditionType,
        values,
        dueDateFieldName
      )
      thisModule.initializeInvalidWorkItemsField(invalidWorkItems, field)

      if (conditionType === Conditions.resolved)
        invalidWorkItems[field][Conditions.resolved] =
          result as InvalidResolvedValues
      else invalidWorkItems[field][conditionType] = result as Issue[]
    })
  }
  return invalidWorkItems
}

export function checkIfRelationExists(workItems: Issue[]) {
  return {
    invalidWorkItems: workItems.filter((workItem) => {
      if (!('relations' in workItem)) return true
      if (workItem.relations) {
        return workItem.relations.length === 0
      }
    }),
  }
}

function expectedIssueToResult(
  field: string,
  expected: string,
  issue: Issue
): Result {
  return {
    criterion: `The work item [(${issue.id}) ${issue.title}] must have '${expected}' value in field '${field}'`,
    justification: `The work item [(${issue.id}) ${issue.title}] has a wrong value '${issue[field]}' in field '${field}'`,
    fulfilled: false,
    metadata: {
      url: issue.url,
      id: issue.id,
      title: issue.title,
      field: field,
    },
  }
}

function illegalIssueToResult(
  field: string,
  illegal: string,
  issue: Issue
): Result {
  return {
    criterion: `The work item [(${issue.id}) ${issue.title}] must not have '${illegal}' value in field '${field}'`,
    justification: `The work item [(${issue.id}) ${issue.title}] has a wrong value '${issue[field]}' in field '${field}'`,
    fulfilled: false,
    metadata: {
      url: issue.url,
      id: issue.id,
      title: issue.title,
      field: field,
    },
  }
}

function existIssueToResult(
  field: string,
  conditions: string[],
  issue: Issue
): Result {
  return {
    criterion: `The work item [(${issue.id}) ${
      issue.title
    }] must satisfy any of the conditions '${conditions.join(', ')}'`,
    justification: `The work item [(${issue.id}) ${issue.title}] does not satisfy any provided condition`,
    fulfilled: false,
    metadata: {
      url: issue.url,
      id: issue.id,
      title: issue.title,
      field: field,
    },
  }
}

function overdueToResult(dueDateFieldName: string, issue: Issue): Result {
  return {
    criterion: `The work item [(${issue.id}) ${issue.title}] must be resolved`,
    justification: `The work item [(${issue.id}) ${issue.title}] was not resolved before its due date ${issue[dueDateFieldName]}`,
    fulfilled: false,
    metadata: {
      url: issue.url,
      id: issue.id,
      title: issue.title,
      dueDateField: dueDateFieldName,
    },
  }
}

function undefinedDueDateToResult(
  dueDateFieldName: string,
  issue: Issue
): Result {
  return {
    criterion: `The work item [(${issue.id}) ${issue.title}] must be resolved`,
    justification: `The work item [(${issue.id}) ${issue.title}] has no due date field ${dueDateFieldName}`,
    fulfilled: false,
    metadata: {
      url: issue.url,
      id: issue.id,
      title: issue.title,
      dueDateField: dueDateFieldName,
    },
  }
}

function invalidResolvedValuesToResults(
  invalidResolvedValues: InvalidResolvedValues,
  dueDateFieldName: string
): Result[] {
  const results: Result[] = []
  for (const [key, value] of Object.entries(invalidResolvedValues)) {
    if (key === CheckGeneralResult.overdue) {
      ;(value as Issue[]).forEach((issue) => {
        results.push(overdueToResult(dueDateFieldName, issue))
      })
    } else if (key === CheckGeneralResult.undefinedDueDate) {
      ;(value as Issue[]).forEach((issue) => {
        results.push(undefinedDueDateToResult(dueDateFieldName, issue))
      })
    }
  }
  return results
}

function invalidWorkItemsToResults(
  invalidWorkItems: InvalidIssues,
  dueDateFieldName: string
): Result[] {
  const results: Result[] = []
  for (const [field, value] of Object.entries(invalidWorkItems)) {
    for (const [condition, issues] of Object.entries(value)) {
      if (condition === Conditions.resolved) {
        results.push(
          ...invalidResolvedValuesToResults(
            issues as InvalidResolvedValues,
            dueDateFieldName
          )
        )
      } else if (condition === Conditions.expected) {
        ;(issues as Issue[]).forEach((issue) => {
          // TODO: expected value is not known so far
          results.push(expectedIssueToResult(field, '?', issue))
        })
      } else if (condition === Conditions.illegal) {
        // TODO: illegal value is not known so far
        ;(issues as Issue[]).forEach((issue) => {
          results.push(illegalIssueToResult(field, '?', issue))
        })
      } else if (condition === Conditions.exists) {
        // TODO: conditions are not known so far
        ;(issues as Issue[]).forEach((issue) => {
          results.push(existIssueToResult(field, [], issue))
        })
      }
    }
  }
  return results
}

export function checkWorkItemsRecursively(
  workItems: Issue[],
  levelConfig: WorkItemsConfig,
  dueDateFieldName: string,
  stateFieldName: string,
  closedStates: string[],
  level = 0
): Result[] {
  const results: Result[] = []

  if (levelConfig.evaluate?.checks?.dataExists) {
    if (workItems.length === 0) {
      results.push({
        criterion: `work items in level ${level} must be available`,
        justification: `There are no work items in level ${level}`,
        fulfilled: false,
      })
    } else {
      results.push({
        criterion: `work items in level ${level} must be available`,
        justification: `There are ${workItems.length} work items in level ${level}`,
        fulfilled: true,
      })
    }
  }

  if (levelConfig?.evaluate?.checks?.cycleInDays) {
    const resultCheckInCycle = checkInCycle(
      workItems,
      stateFieldName,
      closedStates,
      levelConfig?.evaluate.checks?.cycleInDays,
      dueDateFieldName
    )
    if (!resultCheckInCycle) {
      results.push({
        criterion: `work items in level ${level} must be in cycle`,
        justification: `There are work items in level ${level} that are not in cycle`,
        fulfilled: false,
      })
    } else {
      results.push({
        criterion: `work items in level ${level} must be in cycle`,
        justification: `All work items in level ${level} are in cycle`,
        fulfilled: true,
      })
    }
  }

  if (levelConfig?.evaluate?.checks?.relationsExists) {
    const invalidWorkItems = thisModule.checkIfRelationExists(workItems)
    if (invalidWorkItems.invalidWorkItems.length !== 0) {
      results.push({
        criterion: `work items in level ${level} must have relations`,
        justification: `There are ${invalidWorkItems.invalidWorkItems.length} work items in level ${level} that have no relations`,
        fulfilled: false,
      })
    } else {
      results.push({
        criterion: `work items in level ${level} must have relations`,
        justification: `All work items in level ${level} have relations`,
        fulfilled: true,
      })
    }
  }

  const fields = levelConfig?.evaluate?.checks?.fields
  if (fields) {
    const invalidWorkItems = thisModule.checkWorkItems(
      workItems,
      fields,
      stateFieldName,
      closedStates,
      dueDateFieldName
    )
    if (Object.keys(invalidWorkItems).length !== 0) {
      results.push(
        ...invalidWorkItemsToResults(invalidWorkItems, dueDateFieldName)
      )
    } else {
      results.push({
        criterion: `work items in level ${level} must have valid fields`,
        justification: `All work items in level ${level} have valid fields`,
        fulfilled: true,
      })
    }
  } else {
    results.push({
      criterion: `work items in level ${level} must have valid fields`,
      justification: `No fields to check in level ${level}`,
      fulfilled: true,
    })
  }

  const relations = workItems
    .filter((workItem) => workItem.relations)
    .flatMap((workItem) => workItem.relations)

  if (relations.length !== 0 && levelConfig.children) {
    const recursiveResults = thisModule.checkWorkItemsRecursively(
      relations,
      levelConfig.children,
      dueDateFieldName,
      stateFieldName,
      closedStates,
      level + 1
    )
    results.push(...recursiveResults)
  }

  return results
}

function determineClosedState(config: Config) {
  let closedStates = config?.workItems?.evaluate?.settings?.closedStates
  if (!closedStates) {
    closedStates = ['Closed']
    console.log("No closed states specified, using default: ['Closed']")
  }
  return closedStates
}

export function evaluate(
  adoFetcherResponse: Dictionary,
  evaluatorFileData: Config
): AppOutput {
  const appOutput = new AppOutput()
  const workItems = adoFetcherResponse.workItems
  const dueDateFieldName =
    evaluatorFileData?.workItems?.evaluate?.settings?.dueDateFieldName || ''
  const closedStates = determineClosedState(evaluatorFileData)
  const stateFieldName = 'state'
  const results = thisModule.checkWorkItemsRecursively(
    workItems,
    evaluatorFileData.workItems,
    dueDateFieldName,
    stateFieldName,
    closedStates
  )
  appOutput.setStatus('GREEN')
  appOutput.setReason('All work items are valid')
  for (const result of results) {
    if (!result.fulfilled) {
      appOutput.setStatus('RED')
      appOutput.setReason('Some work items are invalid')
    }
    appOutput.addResult(result)
  }
  return appOutput
}
