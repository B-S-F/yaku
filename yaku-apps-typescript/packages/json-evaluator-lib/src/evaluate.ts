// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import jp from 'jsonpath'
import ivm from 'isolated-vm'

import {
  all as all_cond,
  any as any_cond,
  one as one_cond,
  none as none_cond,
  evaluateCondition,
  evaluateConcatenationCondition,
} from './conditions.js'

import {
  CheckResults,
  ConcatenationResult,
  ReasonPackage,
  Status,
} from './types.js'
import { GetLogger } from '@B-S-F/autopilot-utils'

const all = all_cond
const any = any_cond
const one = one_cond
const none = none_cond

export const evalCheck = (
  condition: string,
  reference: string,
  data: unknown,
  options: {
    log?: string
    true?: Status
    false?: Status
    return_if_empty?: Status
    return_if_not_found?: Status
  },
): CheckResults => {
  const ref = jp.query(data, reference)

  const result: CheckResults = {
    ref: reference,
    condition: condition,
    status: 'RED',
    bool: false,
    reasonPackages: [],
  }

  if (ref.length === 0) {
    if (reference.includes('[?(')) {
      const logger = GetLogger()
      logger.warn(
        'Warning: no JSON data was found. Could be ok, but if in doubt, ' +
          `double-check your JSONPath reference expression (\`${reference}\`).`,
      )
    } else {
      result.status = options.return_if_not_found || 'RED'
      return result
    }
  } else if (ref.length === 1) {
    let emptyCondition =
      (Array.isArray(ref[0]) && ref[0].length === 0) ||
      (typeof ref[0] === 'object' && !Object.keys(ref[0]).length)
    if (emptyCondition) {
      result.status = options.return_if_empty || 'RED'
      return result
    } else {
      if (ref[0].length !== undefined) {
        let emptyFlag = true
        for (let i = 0; i < ref[0].length; i++) {
          emptyCondition =
            (Array.isArray(ref[0][i]) && ref[0][i].length === 0) ||
            (typeof ref[0][i] === 'object' && !Object.keys(ref[0][i]).length)
          if (!emptyCondition) {
            emptyFlag = false
          }
        }
        if (emptyFlag) {
          result.status = options.return_if_empty || 'RED'
          return result
        }
      }
    }
  }

  if (condition.match(/all|any|one|none/)) {
    const isolate = new ivm.Isolate()
    const context = isolate.createContextSync()
    const jail = context.global
    jail.setSync('global', jail.derefInto())
    jail.setSync('ref', new ivm.ExternalCopy(ref).copyInto())
    jail.setSync('all', all)
    jail.setSync('any', any)
    jail.setSync('one', one)
    jail.setSync('none', none)
    const script = isolate.compileScriptSync(condition)
    const output: { result: boolean; reasonPackage?: ReasonPackage[] } =
      script.runSync(context, { timeout: 5000, copy: true })
    result.bool = output.result
    result.reasonPackages = output.reasonPackage ?? []

    if (result.bool) {
      result.status = options.true ?? 'GREEN'
    } else {
      result.status = options.false ?? 'RED'
    }

    let emptyCondition =
      result.reasonPackages[0] === undefined && ref.length === 0
    const greenStatusCondition =
      result.reasonPackages[0] === undefined && ref.length > 0

    if (emptyCondition) {
      result.status = options.return_if_empty || 'RED'
    } else if (greenStatusCondition) {
      result.status = 'GREEN'
    } else if (result.reasonPackages[0].reasons.length === 1) {
      const reasons = result.reasonPackages[0].reasons
      emptyCondition =
        (Array.isArray(reasons[0]) && reasons[0].length === 0) ||
        (typeof reasons[0] === 'object' && !Object.keys(reasons[0]).length)
      if (emptyCondition) {
        result.status = options.return_if_empty || 'RED'
      }
    } else if (result.reasonPackages[0].reasons.length === 0) {
      result.status = options.return_if_not_found || 'RED'
    }
  } else {
    let reasons
    ;[result.bool, reasons] = evaluateCondition(ref, condition)
    result.reasonPackages = [{ reasons, context: ref }]
    if (result.bool) {
      result.status = options.true ?? 'GREEN'
    } else {
      result.status = options.false ?? 'RED'
    }
  }

  //Trim context to contain only what's specified in the log
  if (result.reasonPackages!.length > 0) {
    result.reasonPackages = result.reasonPackages!.map((reasonPackage) => {
      if (options.log && typeof reasonPackage.context === 'object') {
        reasonPackage.context = jp.query(reasonPackage.context, options.log!)[0]
      } else {
        reasonPackage.context = undefined
      }
      return reasonPackage
    })
  }
  return result
}

export const evalConcatenation = (
  condition: string,
  checks: Record<string, CheckResults>,
) => {
  const splitExpression = condition.split(/(&&|\|\|)/g).map((str) => str.trim())
  const concatExpression = splitExpression
    .map((str) => {
      if (str === '&&' || str === '||') {
        return str
      }
      try {
        return checks[str].status
      } catch (error) {
        throw new Error(
          'Error in concatenation condition. Please check the concatenation condition.',
        )
      }
    })
    .join(' ')
  const concatenationResult: ConcatenationResult = {
    condition: condition,
    status: evaluateConcatenationCondition(concatExpression),
  }
  return concatenationResult
}
