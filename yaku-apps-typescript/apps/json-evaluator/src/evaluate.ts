import {
  evalCheck,
  evalConcatenation,
  readJson,
} from '@B-S-F/json-evaluator-lib'
import { AppOutput, Result } from '@B-S-F/autopilot-utils'

import { ChecksResult, Config, Concatenation } from './types'
import Formatter from './formatter'

export const evaluate = async (
  jsonFile: string,
  config: Config
): Promise<AppOutput> => {
  const results: Result[] = []
  const data = await readJson(jsonFile)
  // evaluate checks
  const checksResult: ChecksResult = {}
  for (const check of config.checks) {
    const checkResults = evalCheck(check.condition, check.ref, data, {
      ...check,
    })

    checksResult[check.name] = checkResults

    checkResults.reasonPackages
      ?.map((reasonPackage) =>
        Formatter.formatReasonPackage(check, checkResults, reasonPackage)
      )
      .forEach((result) => result && results.push(result))

    if (checkResults.reasonPackages?.length === 0) {
      const result = Formatter.formatReasonPackage(check, checkResults, {
        reasons: [],
        context: undefined,
      })
      if (result !== undefined) results.push(result)
    }
  }
  // evaluate concatenation
  const concatenation: Concatenation = {
    condition: config.concatenation
      ? config.concatenation.condition
      : Object.values(config.checks)
          .map(({ name }) => name)
          .join(' && '),
  }

  const { condition: concatCondition, status } = evalConcatenation(
    concatenation.condition,
    checksResult
  )

  if (config.concatenation) {
    results.push({
      criterion: `**CONCATENATION CONDITION:** ${concatCondition}`,
      justification: `Evaluation result is "${status}" with this condition`,
      fulfilled: status === 'GREEN',
    })
  }

  const appOutput = new AppOutput()
  appOutput.setStatus(status)

  appOutput.setReason(
    status === 'GREEN'
      ? 'All fields have valid values'
      : 'Some fields do not have valid values'
  )
  for (const result of results) {
    appOutput.addResult(result)
  }

  return appOutput
}
