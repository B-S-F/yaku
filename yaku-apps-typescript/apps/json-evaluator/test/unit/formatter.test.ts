import { afterEach, describe, it, expect, vi } from 'vitest'
import { AppError, GetLogger } from '@B-S-F/autopilot-utils'

import Formatter from '../../src/formatter'

describe('getConditionQuantity', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should throw a AppError on missing condition', () => {
    expect(() => Formatter.getConditionQuantity(undefined)).toThrowError(
      new AppError('Missing condition')
    )
  })

  it('should return undefined if no match is found', () => {
    const condition = "$.category === 'fiction'"
    expect(Formatter.getConditionQuantity(condition)).toEqual(undefined)
  })

  it('should return the matchType if a match is found', () => {
    const condition = `all(ref, "$.category === 'fiction'")`
    const expectedResult = 'all'
    expect(Formatter.getConditionQuantity(condition)).toEqual(expectedResult)
  })
})

describe('isolateCondition', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should throw a AppError for undefined condition', () => {
    expect(() => Formatter.isolateCondition(undefined)).toThrowError(
      new AppError('Missing condition')
    )
  })

  it('should return the plain condition if no match is found', () => {
    const condition = "$.category === 'fiction'"
    expect(Formatter.isolateCondition(condition)).toEqual(condition)
  })

  it('should return the isolated condition if match is found', () => {
    const condition = `all(ref, "$.category === 'fiction'")`
    const expectedResult = `"$.category === 'fiction'"`
    expect(Formatter.isolateCondition(condition)).toEqual(expectedResult)
  })
})

describe('tokenizeCondition', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should throw a AppError for undefined condition', () => {
    expect(() => Formatter.tokenizeCondition(undefined)).toThrowError(
      new AppError('Missing condition')
    )
  })

  it('should throw a AppError on bad match', () => {
    expect(() => Formatter.tokenizeCondition(' ')).toThrowError(
      new AppError('Condition exists, but no participants were matched')
    )
  })

  it('should return a single string on incomplete match', () => {
    const condition = 'some bad string'
    expect(Formatter.isolateCondition(condition)).toEqual('some bad string')
  })

  it('should return a match containing a token, a condition and another token', () => {
    const condition = `"$.category === 'fiction'"`
    const expectedResult = [`"$.category`, '===', `'fiction'"`]
    expect(Formatter.tokenizeCondition(condition)).toEqual(expectedResult)
  })
})

describe('cleanString', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return an empty string for undefined dirtyString', () => {
    expect(Formatter.cleanString(undefined)).toEqual('')
  })

  it('should return an empty string on no match', () => {
    const badString = '.?>,'
    expect(Formatter.cleanString(badString)).toEqual('')
  })

  it('should return a clean string (only letters and numbers) on match', () => {
    const dirtyString = `"$.category`
    expect(Formatter.cleanString(dirtyString)).toEqual('category')
  })
})

describe('getConditionParticipants', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should throw a AppError on bad condition', () => {
    const condition = ' '
    const expectedError = new AppError(
      'Condition exists, but no participants were matched'
    )
    const isolateConditionMock = vi.spyOn(Formatter, 'isolateCondition')
    const tokenizeConditionMock = vi.spyOn(Formatter, 'tokenizeCondition')
    const cleanStringMock = vi.spyOn(Formatter, 'cleanString')

    expect(() => Formatter.getConditionParticipants(condition)).toThrowError(
      expectedError
    )

    expect(isolateConditionMock).not.toBeCalled()
    expect(tokenizeConditionMock).toBeCalledTimes(1)
    expect(cleanStringMock).toBeCalledTimes(0)
  })

  it('should get an array containing the subject, operation and receiver, without quantity', () => {
    const condition = "$.category === 'fiction'"
    const expectedResult = ['category', 'equal to', 'fiction']

    const isolateConditionMock = vi.spyOn(Formatter, 'isolateCondition')
    const tokenizeConditionMock = vi.spyOn(Formatter, 'tokenizeCondition')
    const cleanStringMock = vi.spyOn(Formatter, 'cleanString')

    tokenizeConditionMock.mockImplementation(() => [
      '$.category',
      '===',
      'fiction',
    ])
    cleanStringMock.mockImplementationOnce(() => 'category')
    cleanStringMock.mockImplementationOnce(() => 'fiction')

    const result = Formatter.getConditionParticipants(condition)
    expect(isolateConditionMock).not.toBeCalled()
    expect(tokenizeConditionMock).toBeCalledTimes(1)
    expect(cleanStringMock).toBeCalledTimes(2)
    expect(result).toEqual(expectedResult)
  })

  it('should get an array containing the subject, operation and receiver, with quantity', () => {
    const condition = `all(ref, "$.category === 'fiction'")`
    const expectedResult = ['category', 'equal to', 'fiction']

    const isolateConditionMock = vi.spyOn(Formatter, 'isolateCondition')
    const tokenizeConditionMock = vi.spyOn(Formatter, 'tokenizeCondition')
    const cleanStringMock = vi.spyOn(Formatter, 'cleanString')

    isolateConditionMock.mockImplementation(() => `$.category === 'fiction'`)
    tokenizeConditionMock.mockImplementation(() => [
      '$.category',
      '===',
      'fiction',
    ])
    cleanStringMock.mockImplementationOnce(() => 'category')
    cleanStringMock.mockImplementationOnce(() => 'fiction')

    const result = Formatter.getConditionParticipants(condition, 'all')
    expect(result).toEqual(expectedResult)
    expect(isolateConditionMock).toBeCalledTimes(1)
    expect(tokenizeConditionMock).toBeCalledTimes(1)
    expect(cleanStringMock).toBeCalledTimes(2)
  })
})

describe('getReasonMessage', () => {
  it('should return the reasons with context value appended', () => {
    const reasons = 'Reason 1, Reason 2'
    const context = { property: undefined, value: 'Context Value' }
    const expectedResult = 'Reason 1, Reason 2, Context Value'
    expect(Formatter.getReasonMessage(reasons, context)).toEqual(expectedResult)
  })

  it('should return the reasons if context value is not provided', () => {
    const reasons = 'Reason 1, Reason 2'
    const context = { property: 'Context Property', value: undefined }
    const expectedResult = 'Reason 1, Reason 2'
    expect(Formatter.getReasonMessage(reasons, context)).toEqual(expectedResult)
  })

  it('should log a warning if context value is not provided but context property is', () => {
    const reasons = 'Reason 1, Reason 2'
    const context = { property: 'Context Property', value: undefined }
    const logger = GetLogger()
    const loggerWarnSpy = vi.spyOn(logger, 'warn')
    const expectedResult = 'Reason 1, Reason 2'
    expect(Formatter.getReasonMessage(reasons, context)).toEqual(expectedResult)
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      `Warning: log value not found for property: ${context.property}`
    )
  })

  it('should return the reasons if context is not provided', () => {
    const reasons = 'Reason 1, Reason 2'
    const context = { property: undefined, value: undefined }
    const expectedResult = 'Reason 1, Reason 2'
    expect(Formatter.getReasonMessage(reasons, context)).toEqual(expectedResult)
  })
})

describe('getJustificationMessage', () => {
  it('should return `No resulted values from this query` in case there are no reasons and no quantity', () => {
    const quantity = undefined
    const reasons = ''
    const expectedResult = 'No resulted values from this query'
    expect(Formatter.getJustificationMessage(quantity, reasons)).toEqual(
      expectedResult
    )
  })

  it('should return the actual values for reasons when there is no quantity, but there are reasons', () => {
    const quantity = undefined
    const reasons = 'Reason 1, Reason 2'
    const expectedResult = 'Actual values equal: "**Reason 1, Reason 2**"'
    expect(Formatter.getJustificationMessage(quantity, reasons)).toEqual(
      expectedResult
    )
  })

  it('should return the appropriate message for `all` quantity', () => {
    const quantity = 'all'
    const reasons = 'Reason 1, Reason 2'
    const expectedResult = `One or more values do not satisfy the condition: "**Reason 1, Reason 2**"`
    expect(Formatter.getJustificationMessage(quantity, reasons)).toEqual(
      expectedResult
    )
  })

  it('should return the appropriate message for `any` quantity', () => {
    const quantity = 'any'
    const reasons = 'Reason 1, Reason 2'
    const expectedResult = `None satisfy the condition. Actual values are: "**Reason 1, Reason 2**"`
    expect(Formatter.getJustificationMessage(quantity, reasons)).toEqual(
      expectedResult
    )
  })

  it('should return the appropriate message for `one` quantity', () => {
    const quantity = 'one'
    const reasons = 'Reason 1, Reason 2'
    const expectedResult = `None or more than one values satisfy the condition: "**Reason 1, Reason 2**"`
    expect(Formatter.getJustificationMessage(quantity, reasons)).toEqual(
      expectedResult
    )
  })

  it('should return the appropriate message for `none` quantity', () => {
    const quantity = 'none'
    const reasons = 'Reason 1, Reason 2'
    const expectedResult = `Some values satisfy the condition: "**Reason 1, Reason 2**"`
    expect(Formatter.getJustificationMessage(quantity, reasons)).toEqual(
      expectedResult
    )
  })

  it('should throw an error when the quantity is not appropriate', () => {
    const quantity = 'bad'
    const reasons = 'Reason 1, Reason 2'
    expect(() =>
      Formatter.getJustificationMessage(quantity, reasons)
    ).toThrowError(new AppError('Bad quantity'))
  })
})

describe('formatMessage', () => {
  it('', () => {})
})

describe('formatReasonPackage', () => {
  it('', () => {})
})
