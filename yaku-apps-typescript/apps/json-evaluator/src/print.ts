// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import 'colors'
import { ReasonPackage } from '@B-S-F/json-evaluator-lib/src/types'

import { PartialCheckResult } from './types'

export const stringifyFirstLevel = (obj: Record<string, unknown>) => {
  const firstLevelObj: Record<string, unknown> = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key]
      if (typeof val !== 'object' || val === null) {
        firstLevelObj[key] = val
      } else {
        firstLevelObj[key] = `<${typeof val}>` // use the value's type as a placeholder
      }
    }
  }
  return JSON.stringify(firstLevelObj)
}

export const parseReasons = (
  reasonPackage: ReasonPackage | undefined,
): {
  context: string | undefined
  reasons: string[]
} => {
  if (!reasonPackage) {
    return {
      reasons: [],
      context: undefined,
    }
  }

  const parsedReasonPackage: {
    reasons: string[]
    context: string | undefined
  } = {
    reasons: [],
    context: reasonPackage.context ? String(reasonPackage.context) : undefined,
  }

  parsedReasonPackage.reasons = reasonPackage.reasons.map((reason) => {
    if (typeof reason === 'object' && !Array.isArray(reason)) {
      return stringifyFirstLevel(reason)
    } else {
      return JSON.stringify(reason)
    }
  })

  return parsedReasonPackage
}

export function colorStatusString(str: string): string {
  const color = str.toLowerCase()
  switch (color) {
    case 'red':
      return str.red
    case 'green':
      return str.green
    case 'yellow':
      return str.yellow
    default:
      return str
  }
}

export const printCheckResult = (
  checkName: string,
  check: PartialCheckResult,
) => {
  const name = checkName.toUpperCase()
  console.log('\n' + name + '\n' + '-'.repeat(name.length))
  if (check.ref) console.log('* **ref**: ' + `${check.ref}`.blue)
  console.log('* **condition**: ' + `${check.condition}`.blue)
  if (check.bool) console.log('* **result**: ' + `${check.bool}`.blue)
  console.log('* **status**: ' + `${colorStatusString(check.status!)}`)
  if (check.reasonPackage && check.reasonPackage!.reasons.length > 0)
    console.log(
      '* **reasons**: ' + `${parseReasons(check.reasonPackage!).reasons}`,
    )
}
