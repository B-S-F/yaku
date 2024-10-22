import jp from 'jsonpath'
import ivm from 'isolated-vm'

import { ReasonPackage, Status } from './types.js'
import { searchOnFail } from './util.js'

export const evaluateCondition = (
  ref: unknown,
  condition: string
): [boolean, any] => {
  let newCondition = ''
  const query = condition.match(
    /(?<=\()[$](?=\))|\$(\S+?)(?=[\s=!()])|\$(\S+)/g
  )
  if (!query || query.length === 0) {
    throw new Error(`Error in condition: ${condition}`)
  }
  if (query.length > 1) {
    throw new Error(
      `Error in condition: ${condition}. Only one reference is allowed.`
    )
  }
  let values: unknown[] = []
  if (typeof ref === 'object') {
    values = jp.query(ref, query[0])
  } else {
    values = [ref]
  }
  if (condition.includes('.includes(')) {
    newCondition = condition.replace(query[0], `values`)
  } else {
    newCondition = condition.replace(query[0], `values[0]`)
  }
  const isolate = new ivm.Isolate()
  const context = isolate.createContextSync()
  const jail = context.global
  jail.setSync('global', jail.derefInto())
  jail.setSync('values', new ivm.ExternalCopy(values).copyInto())
  const script = isolate.compileScriptSync(newCondition)
  const resultBool = script.runSync(context, { timeout: 5000 })
  const resultReasons = values
  return [resultBool, resultReasons]
}

export const all = (
  iterable: any[],
  condition: string
): { result: boolean; reasonPackage?: ReasonPackage[] } => {
  const continueSearchOnFail = searchOnFail()
  const invalidElements: ReasonPackage[] = []

  for (const value of iterable) {
    if (!value) {
      invalidElements.push({ reasons: value, context: value })
      if (!continueSearchOnFail) {
        return { result: false, reasonPackage: invalidElements }
      }
      continue
    }
    const [result, reasons] = evaluateCondition(value, condition)
    if (!result) {
      invalidElements.push({ reasons, context: value })
      if (!continueSearchOnFail) {
        return { result: false, reasonPackage: invalidElements }
      }
    }
  }

  if (invalidElements.length > 0) {
    return { result: false, reasonPackage: invalidElements }
  }
  return { result: true }
}

export const any = (
  iterable: any[],
  condition: string
): { result: boolean; reasonPackage?: ReasonPackage[] } => {
  const invalidElements: ReasonPackage[] = []

  for (const value of iterable) {
    if (!value) {
      continue
    }
    const [result, reason] = evaluateCondition(value, condition)
    invalidElements.push({ reasons: reason, context: value })
    if (result) {
      return { result: true }
    }
  }
  return { result: false, reasonPackage: invalidElements }
}

export const one = (
  iterable: any[],
  condition: string
): { result: boolean; reasonPackage?: ReasonPackage[] } => {
  const invalidElements: ReasonPackage[] = []
  const validElements: ReasonPackage[] = []
  const continueSearchOnFail = searchOnFail()

  for (const value of iterable) {
    if (!value) {
      invalidElements.push({ reasons: value, context: value })
      continue
    }
    const [result, reason] = evaluateCondition(value, condition)
    if (result) {
      validElements.push({ reasons: reason, context: value })
      if (validElements.length > 1 && !continueSearchOnFail) {
        return { result: false, reasonPackage: validElements }
      }
    } else {
      invalidElements.push({ reasons: reason, context: value })
    }
  }

  if (validElements.length == 1) {
    return { result: true }
  } else if (validElements.length > 1) {
    return { result: false, reasonPackage: validElements }
  }
  return { result: false, reasonPackage: invalidElements }
}

export const none = (
  iterable: any[],
  condition: string
): { result: boolean; reasonPackage?: ReasonPackage[] } => {
  const invalidElements: ReasonPackage[] = []
  const continueSearchOnFail = searchOnFail()

  for (const value of iterable) {
    if (!value) {
      continue
    }
    const [result, reasons] = evaluateCondition(value, condition)
    if (result) {
      invalidElements.push({ reasons: reasons, context: value })
      if (!continueSearchOnFail) {
        return { result: false, reasonPackage: invalidElements }
      }
    }
  }

  if (invalidElements.length > 0) {
    return { result: false, reasonPackage: invalidElements }
  }
  return { result: true }
}

export function evaluateConcatenationCondition(condition: string): Status {
  const isolate = new ivm.Isolate()
  const context = isolate.createContextSync()
  const jail = context.global
  jail.setSync('global', jail.derefInto())
  jail.setSync('GREEN', 'GREEN')
  jail.setSync('YELLOW', 'YELLOW')
  jail.setSync('RED', false)
  const script = isolate.compileScriptSync(condition)
  const result = script.runSync(context, { timeout: 5000 })
  if (result === false) {
    return 'RED'
  } else if (result === 'GREEN' || result === 'YELLOW') {
    const isolate = new ivm.Isolate()
    const context = isolate.createContextSync()
    const jail = context.global
    jail.setSync('global', jail.derefInto())
    jail.setSync('GREEN', 'GREEN')
    jail.setSync('YELLOW', false)
    jail.setSync('RED', false)
    const script = isolate.compileScriptSync(condition)
    const result = script.runSync(context, { timeout: 5000 })
    if (result === false) {
      return 'YELLOW'
    }
  }
  return 'GREEN'
}
