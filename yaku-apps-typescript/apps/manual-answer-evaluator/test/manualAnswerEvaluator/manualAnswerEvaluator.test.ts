// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { SpyInstanceFn, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  evaluate,
  getManualAnswer,
  readManualAnswer,
} from '../../src/manualAnswerEvaluator'
import {
  FileData,
  readContentAndMtime,
} from '../../src/utils/readContentAndMtime'
import { AppError, InitLogger } from '@B-S-F/autopilot-utils'

describe('getManualAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    InitLogger('test')
  })
  it('should return the manual answer', () => {
    const parsedInput: FileData = {
      content: 'answer',
      mtime: '2020-01-01T00:00:00.000Z',
    }
    expect(getManualAnswer(parsedInput)).toBe('answer')
  })
  it('should throw Error No manual answer found', () => {
    const parsedInput: FileData = {
      content: undefined,
      mtime: '2020-01-01T00:00:00.000Z',
    }
    expect(() => getManualAnswer(parsedInput)).toThrow('No manual answer found')
  })
})

describe('readManualAnswer', () => {
  vi.mock('../../src/utils/readContentAndMtime')
  const mockReadContentAndMtime = readContentAndMtime as SpyInstanceFn

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    InitLogger('test')
  })
  it('should return the answer and the modification Date', async () => {
    mockReadContentAndMtime.mockResolvedValue({
      content: 'answer',
      mtime: '2020-01-01T00:00:00.000Z',
    })
    const manualAnswer = await readManualAnswer('my-file.md')
    expect(manualAnswer).toEqual({
      answer: 'answer',
      modificationDate: new Date('2020-01-01T00:00:00.000Z'),
    })
  })
})

describe('evaluate', () => {
  vi.mock('../../src/manualAnswerEvaluator/manualAnswer', async () => {
    const manualAnswer = (await vi.importActual(
      '../../src/manualAnswerEvaluator/manualAnswer'
    )) as any
    return {
      ...manualAnswer,
      readManualAnswer: vi.fn().mockResolvedValue({
        answer: 'answer',
        modificationDate: new Date('2020-01-01T00:00:00.000Z'),
      }),
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    InitLogger('test')
  })

  it('should return the correct output comment', async () => {
    const mockReadManualAnswer = readManualAnswer as SpyInstanceFn
    const consoleSpy = vi.spyOn(console, 'log')
    mockReadManualAnswer.mockResolvedValue({
      answer: 'answer',
      modificationDate: new Date('2020-01-01T00:00:00.000Z'),
    })
    await evaluate({
      manual_answer_file: 'my-file.md',
      expiration_time: '1d',
    })
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({
        status: 'RED',
        reason:
          'answer\n**The manual answer is expired at 2020-01-02T00:00:00.000Z**',
      })
    )
  })

  it('should support last_modified_date_override', async () => {
    const mockReadManualAnswer = readManualAnswer as SpyInstanceFn
    const consoleSpy = vi.spyOn(console, 'log')
    mockReadManualAnswer.mockResolvedValue({
      answer: 'answer',
      modificationDate: new Date('2020-01-01T00:00:00.000Z'),
    })
    await evaluate({
      manual_answer_file: 'my-file.md',
      expiration_time: '1d',
      last_modified_date_override: '2020-01-02T00:00:00.000Z',
    })
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({
        status: 'RED',
        reason:
          'answer\n**The manual answer is expired at 2020-01-03T00:00:00.000Z**',
      })
    )
  })

  it('should throw an AppError if last_modified_date_override is not valid', async () => {
    const mockReadManualAnswer = readManualAnswer as SpyInstanceFn
    mockReadManualAnswer.mockResolvedValue({
      answer: 'answer',
      modificationDate: new Date('2020-01-01T00:00:00.000Z'),
    })
    await expect(
      evaluate({
        manual_answer_file: 'my-file.md',
        expiration_time: '1d',
        last_modified_date_override: '26.08.2020',
      })
    ).rejects.toThrow(AppError)
  })
})
