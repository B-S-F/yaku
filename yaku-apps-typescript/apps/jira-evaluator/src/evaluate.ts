import {
  checkProperty,
  Conditions,
  Issue,
} from '@B-S-F/issue-validators'
import { AppError, AppOutput, Result } from '@B-S-F/autopilot-utils'
import { Dictionary, InvalidIssues } from './types'

function initializeInvalidIssuesField(
  invalidIssues: InvalidIssues,
  field: string
) {
  if (!invalidIssues[field])
    invalidIssues[field] = {
      [Conditions.exists]: [],
      [Conditions.expected]: [],
      [Conditions.illegal]: [],
    }
}

export const checkIssues = (issues: Issue[], config: Dictionary) => {
  const invalidIssues: InvalidIssues = {}

  if (!config.evaluate.logic) {
    const fields = config.evaluate.fields
    for (const field in fields) {
      const fieldValue = fields[field]
      const fieldName = fieldValue.fieldName

      initializeInvalidIssuesField(invalidIssues, field)

      const conditions: { Conditions: string[] } = fieldValue.conditions
      conditions[Conditions.exists] = []

      Object.keys(conditions).forEach((conditionType) => {
        const result = checkProperty(
          false,
          issues,
          fieldName,
          conditionType as Conditions,
          conditions[conditionType]
        )
        invalidIssues[field][conditionType] = result
      })
    }
  } else if (config.evaluate.logic.toLowerCase() == 'and') {
    const fields = config.evaluate.fields
    const fieldsNumber = Object.keys(fields).length

    let firstFieldResult: Issue[] = []

    let counter = 0
    for (const field in fields) {
      const fieldValue = fields[field]
      const fieldName = fieldValue.fieldName

      initializeInvalidIssuesField(invalidIssues, field)
      const conditions: { Conditions: string[] } = fieldValue.conditions

      if (fieldsNumber == 1) {
        Object.keys(conditions).forEach((conditionType) => {
          const result = checkProperty(
            false,
            issues,
            fieldName,
            conditionType as Conditions,
            conditions[conditionType]
          )
          invalidIssues[field][conditionType] = result
        })
      } else if (counter == 0) {
        Object.keys(conditions).forEach((conditionType) => {
          const result = checkProperty(
            true,
            issues,
            fieldName,
            conditionType as Conditions,
            conditions[conditionType]
          )
          firstFieldResult = [...firstFieldResult, ...result]
        })
      } else if (counter == fieldsNumber - 1) {
        const newIssues = [...firstFieldResult]
        firstFieldResult = []
        Object.keys(conditions).forEach((conditionType) => {
          const result = checkProperty(
            false,
            newIssues,
            fieldName,
            conditionType as Conditions,
            conditions[conditionType]
          )
          invalidIssues[field][conditionType] = result
        })
      } else {
        const newIssues = [...firstFieldResult]
        firstFieldResult = []
        Object.keys(conditions).forEach((conditionType) => {
          const result = checkProperty(
            true,
            newIssues,
            fieldName,
            conditionType as Conditions,
            conditions[conditionType]
          )

          const invalidResult = checkProperty(
            false,
            newIssues,
            fieldName,
            conditionType as Conditions,
            conditions[conditionType],
            dueDatefieldName
          )

          firstFieldResult = [...firstFieldResult, ...result]
          if (firstFieldResult.length == 0) {
            invalidIssues[field][conditionType] = invalidResult
          }
        })
        if (firstFieldResult.length == 0) {
          return invalidIssues
        }
      }
      counter = counter + 1
    }
  } else {
    throw new AppError(
      `Required logic: ${config.evaluate.logic} not supported!`
    )
  }

  return invalidIssues
}

function expectedIssueToResult(
  field: string,
  expected: string,
  issue: Issue
): Result {
  return {
    criterion: `Issue: [${issue.summary}] with ID: [${issue.id}] must have expected value in field '${field}'`,
    justification: `Issue: [${issue.summary}] with ID: [${issue.id}] have non-expected value: [${issue[field].name}] in field '${field}'`,
    fulfilled: false,
    metadata: {
      url: issue.url,
      id: issue.id,
      summary: issue.summary,
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
    criterion: `Issue: [${issue.summary}] with ID: [${issue.id}] must not have an illegal value in field '${field}'`,
    justification: `Issue: [${issue.summary}] with ID: [${issue.id}] have the illegal value: [${issue[field].name}] in field '${field}'`,
    fulfilled: false,
    metadata: {
      url: issue.url,
      id: issue.id,
      summary: issue.summary,
      field: field,
    },
  }
}

function invalidIssuesToResults(invalidIssues: InvalidIssues): Result[] {
  const results: Result[] = []
  for (const [field, value] of Object.entries(invalidIssues)) {
    for (const [condition, issues] of Object.entries(value)) {
      if (condition === Conditions.expected) {
        ;(issues as Issue[]).forEach((issue) => {
          // TODO: expected value is not known so far
          results.push(expectedIssueToResult(field, '?', issue))
        })
      } else if (condition === Conditions.illegal) {
        // TODO: illegal value is not known so far
        ;(issues as Issue[]).forEach((issue) => {
          results.push(illegalIssueToResult(field, '?', issue))
        })
      }
    }
  }
  return results
}

export function evaluate(invalidIssues: InvalidIssues): AppOutput {
  const results: Result[] = []
  results.push(...invalidIssuesToResults(invalidIssues))
  const appOutput = new AppOutput()
  appOutput.setStatus('GREEN')
  appOutput.setReason('All issues are valid')
  if (results.length === 0) {
    results.push({
      criterion: `All issues must have valid fields`,
      justification: `All issues have valid fields`,
      fulfilled: true,
    })
  }
  for (const result of results) {
    if (!result.fulfilled) {
      appOutput.setStatus('RED')
      appOutput.setReason('Some issues are invalid')
    }
    appOutput.addResult(result)
  }
  return appOutput
}

export const __t = process.env.VITEST
  ? {
      initializeInvalidIssuesField,
    }
  : null
