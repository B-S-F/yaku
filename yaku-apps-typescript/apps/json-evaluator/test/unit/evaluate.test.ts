// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { afterEach, describe, it, expect, vi } from 'vitest'
import {
  ConcatenationResult,
  Status,
  evalCheck,
  evalConcatenation,
  readJson,
} from '@B-S-F/json-evaluator-lib'

import { evaluate } from '../../src/evaluate'
import Formatter from '../../src/formatter'

vi.mock('@B-S-F/json-evaluator-lib', () => ({
  evalCheck: vi.fn((condition: string, ref: string, data: any) => {
    switch (ref) {
      case '$.value1':
        return {
          reasonPackages: [{ reasons: data.value1 > 0, context: undefined }],
        }
      case '$.value2':
        return {
          reasonPackages: [
            { reasons: data.value2 == 'foo', context: undefined },
          ],
        }
      default:
        return false
    }
  }),
  evalConcatenation: vi.fn(),
  readJson: vi.fn(),
}))

describe('evaluate', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should correctly evaluate checks and concatenation when concatenation is specified in the config', async () => {
    const jsonFile = 'test.json'
    const config = {
      checks: [
        {
          name: 'check1',
          condition: 'value1 > 0',
          ref: '$.value1',
        },
        {
          name: 'check2',
          condition: 'value2 == "foo"',
          ref: '$.value2',
        },
      ],
      concatenation: {
        condition: 'check1 && check2',
      },
    }
    const data = { value1: 1, value2: 'foo' }

    const concatenationResult = { status: 'GREEN' } as ConcatenationResult
    const concatenationInput = {
      check1: {
        reasonPackages: [
          {
            context: undefined,
            reasons: true,
          },
        ],
      },
      check2: {
        reasonPackages: [
          {
            context: undefined,
            reasons: true,
          },
        ],
      },
    }

    const check = {
      status: undefined,
      ref: undefined,
      condition: undefined,
      bool: undefined,
      reasonPackage: {
        reasons: true,
        context: undefined,
      },
    }

    const options = {
      logProperty: undefined,
    }

    const readJsonMock = vi.mocked(readJson).mockResolvedValueOnce(data)
    const evalCheckMock = vi.mocked(evalCheck)
    const evalConcatenationMock = vi
      .mocked(evalConcatenation)
      .mockReturnValueOnce(concatenationResult)
    const formatMock = vi.spyOn(Formatter, 'formatMessage')
    await evaluate(jsonFile, config)

    expect(readJsonMock).toHaveBeenCalledWith(jsonFile)
    expect(evalCheckMock).toHaveBeenCalledTimes(2)
    expect(evalCheckMock).toHaveBeenCalledWith('value1 > 0', '$.value1', data, {
      ...config.checks[0],
    })
    expect(evalCheckMock).toHaveBeenCalledWith(
      'value2 == "foo"',
      '$.value2',
      data,
      {
        ...config.checks[1],
      },
    )
    expect(formatMock).toHaveBeenCalledTimes(2)
    expect(formatMock).toHaveBeenCalledWith('check1', check, options)

    expect(formatMock).toHaveBeenCalledWith('check2', check, options)
    expect(evalConcatenationMock).toHaveBeenCalledWith(
      'check1 && check2',
      concatenationInput,
    )
  })

  it('should correctly evaluate checks and concatenation when concatenation is not specified in the config', async () => {
    const jsonFile = 'test.json'

    const config = {
      checks: [
        {
          name: 'check1',
          condition: 'value1 > 0',
          ref: '$.value1',
          false: 'YELLOW' as Status,
        },
        {
          name: 'check2',
          condition: 'value2 == "foo"',
          ref: '$.value2',
        },
      ],
    }
    const data = { value1: 1, value2: 'foo' }

    const concatenationResult = {
      status: 'GREEN' as Status,
    } as ConcatenationResult

    const concatenationInput = {
      check1: {
        reasonPackages: [
          {
            context: undefined,
            reasons: true,
          },
        ],
      },
      check2: {
        reasonPackages: [
          {
            context: undefined,
            reasons: true,
          },
        ],
      },
    }

    const check = {
      status: undefined,
      ref: undefined,
      condition: undefined,
      bool: undefined,
      reasonPackage: {
        reasons: true,
        context: undefined,
      },
    }
    const options = {
      logProperty: undefined,
    }

    const readJsonMock = vi.mocked(readJson).mockResolvedValueOnce(data)
    const evalCheckMock = vi.mocked(evalCheck)
    const evalConcatenationMock = vi
      .mocked(evalConcatenation)
      .mockReturnValueOnce(concatenationResult)
    const formatMock = vi.spyOn(Formatter, 'formatMessage')
    await evaluate(jsonFile, config)

    expect(readJsonMock).toHaveBeenCalledWith(jsonFile)
    expect(evalCheckMock).toHaveBeenCalledTimes(2)
    expect(evalCheckMock).toHaveBeenCalledWith('value1 > 0', '$.value1', data, {
      ...config.checks[0],
    })
    expect(evalCheckMock).toHaveBeenCalledWith(
      'value2 == "foo"',
      '$.value2',
      data,
      {
        ...config.checks[1],
      },
    )
    expect(formatMock).toHaveBeenCalledTimes(2)
    expect(formatMock).toHaveBeenCalledWith('check1', check, options)
    expect(formatMock).toHaveBeenCalledWith('check2', check, options)
    expect(evalConcatenationMock).toHaveBeenCalledWith(
      'check1 && check2',
      concatenationInput,
    )
  })
})
