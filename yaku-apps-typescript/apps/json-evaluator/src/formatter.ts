import { CheckResults } from '@B-S-F/json-evaluator-lib'
import { AppError, GetLogger, Result } from '@B-S-F/autopilot-utils'
import { ReasonPackage } from '@B-S-F/json-evaluator-lib/src/types'

import { parseReasons } from './print'
import SentenceBuilder from './sentence-builder'
import { Check } from './types'

const JSONPathOperations: { [key: string]: string } = {
  '==': 'equal to',
  '===': 'equal to',
  '!=': 'not equal to',
  '!==': 'not equal to',
  '<': 'less than',
  '<=': 'less than or equal to',
  '>': 'greater than',
  '>=': 'greater than or equal to',
  includes: 'including',
}
export default class Formatter {
  static getConditionQuantity = (condition: string | undefined) => {
    if (!condition) {
      throw new AppError('Missing condition')
    }

    const quantityPattern = /\b(all|any|one|none)\(.+?\)/g
    const match = condition.match(quantityPattern)?.toString()

    return match?.substring(0, match.indexOf('('))
  }

  static isolateCondition = (condition: string | undefined) => {
    if (!condition) {
      throw new AppError('Missing condition')
    }

    const inQuotesPattern = /("[^"]*")/
    const quoteMatch = condition.match(inQuotesPattern)
    const alreadyIsolated = !(quoteMatch && quoteMatch[1])

    return alreadyIsolated ? condition : quoteMatch[1]
  }

  static tokenizeCondition = (condition: string | undefined) => {
    if (!condition) {
      throw new AppError('Missing condition')
    }
    const operators = Object.keys(JSONPathOperations).sort().reverse().join('|')
    const receiverString = `\\[*(.+?)\\]*`
    const subjectString = `(.*?\\$.+?)`
    const endingSubjectString = `(.*?\\$.+)`

    const conditionSplitMatch = new RegExp(
      `^\\s*${subjectString}\\s*(${operators})\\s*${receiverString}\\s*$|^\\s*${receiverString}\\s*(${operators})\\s*${endingSubjectString}\\s*`,
    )

    const match = condition.match(conditionSplitMatch)
    if (!match) {
      throw new AppError('Condition exists, but no participants were matched')
    }

    const cleanMatch = match.filter((match) => match !== undefined)
    return cleanMatch.slice(1)
  }

  static cleanString = (dirtyString: string | undefined) => {
    if (!dirtyString) {
      return ''
    }

    const lettersAndNumbersRegex = /[a-zA-Z0-9]+/g
    const cleanString = dirtyString.match(lettersAndNumbersRegex)?.join(' ')
    if (!cleanString) {
      return ''
    }
    return cleanString
  }

  static getConditionParticipants = (
    condition: string | undefined,
    quantity?: string,
  ) => {
    // Condition: all(ref, "$.category === 'fiction'")
    const isolatedCondition = quantity
      ? this.isolateCondition(condition)
      : condition

    // isolatedCondition: $.category === 'fiction'
    const [token1, operation, token2]: string[] =
      this.tokenizeCondition(isolatedCondition)

    // token1: $.category, operation: '===', token2: 'fiction'
    const [dirtySubject, dirtyReceiver]: string[] = token1.includes('$')
      ? [token1, token2]
      : [token2, token1]

    const subject = this.cleanString(dirtySubject)
    const operationName = JSONPathOperations[operation]
    const receiver = this.cleanString(dirtyReceiver)

    // subject: category, operation: 'is equal to', receiver: fiction

    return [subject, operationName, receiver]
  }

  static getJustificationMessage = (
    quantity: string | undefined,
    reasons: string,
  ) => {
    if (!quantity) {
      if (!reasons) {
        return 'No resulted values from this query'
      }
      return `Actual values equal: "**${reasons}**"`
    }

    let message = ''
    switch (quantity) {
      case 'all':
        message = `One or more values do not satisfy the condition: `
        break
      case 'any':
        message = `None satisfy the condition. Actual values are: `
        break
      case 'one':
        message = `None or more than one values satisfy the condition: `
        break
      case 'none':
        message = `Some values satisfy the condition: `
        break
      default:
        throw new AppError('Bad quantity')
    }

    if (!reasons) return message + '**not defined**'
    return `${message}"**${reasons}**"`
  }

  static getReasonMessage = (
    reasons: string,
    context: { property: string | undefined; value: string | undefined },
  ) => {
    const contextPrefix = ', '
    if (context.value) {
      if (context.value.includes('https')) {
        return reasons + contextPrefix + `[${context.value}](${context.value})`
      }
      return reasons + contextPrefix + context.value
    }
    if (!context.value && context.property) {
      const logger = GetLogger()
      logger.warn(
        'Warning: log value not found for property: ' + context.property,
      )
    }
    return reasons
  }

  static formatMessage = (
    checkName: string,
    check: Partial<
      Omit<CheckResults, 'reasonPackages'> & { reasonPackage: ReasonPackage }
    >,
    options?: {
      logProperty: string | undefined
    },
  ) => {
    const underscoreRegex = /_+/g

    const name = checkName.replace(underscoreRegex, ' ').toUpperCase()
    const quantity = this.getConditionQuantity(check.condition)

    const [subject, operation, receiver]: string[] =
      this.getConditionParticipants(check.condition, quantity)

    const reference: string = this.cleanString(check.ref)

    const result: string = check.status || 'FAILED'

    const reasonPackage = parseReasons(check.reasonPackage)
    const reasonsString = this.getReasonMessage(
      reasonPackage.reasons.join(', '),
      {
        property: options?.logProperty,
        value: reasonPackage.context,
      },
    )

    const justification =
      result === 'GREEN'
        ? 'Field content satisfy condition'
        : this.getJustificationMessage(quantity, reasonsString)

    const operationString = new SentenceBuilder().getOperation(
      quantity,
      subject,
      reference,
      operation,
      receiver,
    )

    const finalResult: Result = {
      criterion: name ? `**${name}:**${operationString}` : `**Check:**`,
      fulfilled: result === 'GREEN',
      metadata: {
        status: result,
      },
      justification,
    }
    return finalResult
  }

  static formatReasonPackage(
    check: Check,
    checkResults: CheckResults,
    reasonPackage: ReasonPackage,
  ) {
    try {
      const buffer = {
        status: checkResults.status,
        ref: checkResults.ref,
        condition: checkResults.condition,
        bool: checkResults.bool,
        reasonPackage,
      }
      const result = Formatter.formatMessage(check.name, buffer, {
        logProperty: check.log,
      })

      return result
    } catch (error) {
      console.log(
        `Something went wrong while formatting check: ${check.name} result. Non-formatted result: ${reasonPackage.reasons}, ${reasonPackage.context}. Error: ${error}`,
      )
    }
  }
}
