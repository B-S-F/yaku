import { beforeEach, describe, expect, it, vi, SpyInstanceFn } from 'vitest'

import { evaluate } from '../../src/manualAnswerEvaluator/manualAnswer'

import { readEnvAndDoEvaluation } from '../../src/manualAnswerEvaluator'
import { AppError } from '@B-S-F/autopilot-utils'

describe('readEnvAndDoEvaluation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  vi.mock('../../src/manualAnswerEvaluator/manualAnswer')
  const mockEvaluate = evaluate as SpyInstanceFn

  it('should transmit env vars correctly', () => {
    const args = {
      expiration_time: 'foo',
      last_modified_date_override: 'bar',
      manual_answer_file: 'baz',
    }
    readEnvAndDoEvaluation(args)
    expect(mockEvaluate).toBeCalledWith(args)
  })

  it('should throw an AppError if expiration_time is missing', () => {
    const args = {
      last_modified_date_override: 'bar',
      manual_answer_file: 'baz',
    }
    expect(() => readEnvAndDoEvaluation(args)).toThrow(AppError)
  })

  it('should throw an AppError if manual_answer_file is missing', () => {
    const args = {
      expiration_time: 'foo',
      last_modified_date_override: 'bar',
    }
    expect(() => readEnvAndDoEvaluation(args)).toThrow(AppError)
  })

  it('should not raise an error if last_modified_date_override is missing', () => {
    const args = {
      expiration_time: 'foo',
      manual_answer_file: 'bar',
    }
    expect(() => readEnvAndDoEvaluation(args)).not.toThrowError()
    expect(mockEvaluate).toBeCalled()
  })
})
