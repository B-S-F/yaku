// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, it, expect, vi } from 'vitest'

import {
  evaluateCondition,
  all,
  any,
  one,
  none,
  evaluateConcatenationCondition,
} from '../src/conditions.js'

describe('evaluateCondition', () => {
  it('should evaluate a basic condition with a simple reference', () => {
    const ref = [{ foo: 'bar' }]
    const condition = '$[*].foo === "bar"'
    const result = evaluateCondition(ref, condition)
    const expectedResult = [true, ['bar']]
    expect(result).toStrictEqual(expectedResult)
  })

  it('should handle conditions with array references', () => {
    const ref = [{ foo: 'bar' }, { foo: 'baz' }]
    const condition = '$[0].foo === "bar"'
    const result = evaluateCondition(ref, condition)
    const expectedResult = [true, ['bar']]
    expect(result).toStrictEqual(expectedResult)
  })

  it('should handle conditions with the .includes() method', () => {
    const ref = ['foo', 'bar', 'baz']
    const condition = '($[*]).includes("baz")'
    const result = evaluateCondition(ref, condition)
    const expectedResult = [true, ['foo', 'bar', 'baz']]
    expect(result).toStrictEqual(expectedResult)
  })

  it('should throw an error if there are multiple references', () => {
    const ref = [{ foo: { bar: 'baz' }, qux: 'quux' }]
    const condition = '$[*].foo.bar === "baz" && $[*].qux === "quux"'
    expect(() => evaluateCondition(ref, condition)).toThrow(
      'Error in condition: $[*].foo.bar === "baz" && $[*].qux === "quux". Only one reference is allowed.',
    )
  })

  it('should throw an error if the condition is invalid', () => {
    const ref = { foo: 'bar' }
    const condition = 'foo === "bar"' // missing $ symbol
    expect(() => evaluateCondition([ref], condition)).toThrow(
      'Error in condition: foo === "bar"',
    )
  })
})

describe('all', () => {
  it('should return true if all elements pass the condition', () => {
    const iterable = [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'qux' }]
    const condition = '$.foo !== undefined'
    const result = all(iterable, condition)
    expect(result).toEqual({ result: true })
  })

  it('should return false if at least one element fails the condition', () => {
    const iterable = [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'bar' }]
    const condition = '$.foo === "bar"'
    const result = all(iterable, condition)
    expect(result).toEqual({
      result: false,
      reasonPackage: [
        {
          context: { foo: 'baz' },
          reasons: ['baz'],
        },
      ],
    })
  })

  it('should return false if any element is falsy, stoppping at the first breaking element', () => {
    const iterable = [{ foo: 'bar' }, null, { foo: 'baz' }]
    const condition = '$.foo !== undefined'
    const result = all(iterable, condition)
    expect(result).toEqual({
      result: false,
      reasonPackage: [
        {
          reasons: null,
          context: null,
        },
      ],
    })
  })

  it('should return false if any element is falsy, returning all breaking elements', () => {
    const iterable = [{ foo: 'baz' }, null, { foo: 'baz' }, { foo: 'biz' }]
    const condition = '$.foo !== "baz"'

    vi.stubEnv('CONTINUE_SEARCH_ON_FAIL', 'true')

    const result = all(iterable, condition)
    expect(result).toEqual({
      result: false,
      reasonPackage: [
        {
          reasons: ['baz'],
          context: { foo: 'baz' },
        },
        {
          reasons: null,
          context: null,
        },
        {
          reasons: ['baz'],
          context: { foo: 'baz' },
        },
      ],
    })
  })
})

describe('all', () => {
  const testCases = [
    {
      input: [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'qux' }],
      condition: '$.foo !== undefined',
      expectedOutput: { result: true },
      continueSearchOnFail: 'false',
    },
    {
      input: [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'bar' }],
      condition: '$.foo === "bar"',
      expectedOutput: {
        result: false,
        reasonPackage: [{ reasons: ['baz'], context: { foo: 'baz' } }],
      },
      continueSearchOnFail: 'false',
    },
    {
      input: [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'bar' }],
      condition: '$.foo !== "bar"',
      expectedOutput: {
        result: false,
        reasonPackage: [
          { reasons: ['bar'], context: { foo: 'bar' } },
          { reasons: ['bar'], context: { foo: 'bar' } },
        ],
      },
      continueSearchOnFail: 'true',
    },
    {
      input: [{ foo: 'bar' }, null, { foo: 'baz' }],
      condition: '$.foo !== undefined',
      expectedOutput: {
        result: false,
        reasonPackage: [{ reasons: null, context: null }],
      },
      continueSearchOnFail: 'false',
    },
    {
      input: [null, undefined, false],
      condition: '$.foo === "nothing"',
      expectedOutput: {
        result: false,
        reasonPackage: [{ reasons: null, context: null }],
      },
      continueSearchOnFail: 'false',
    },
    {
      input: [null, undefined, false],
      condition: '$.foo === "nothing"',
      expectedOutput: {
        result: false,
        reasonPackage: [
          { reasons: null, context: null },
          { reasons: undefined, context: undefined },
          { reasons: false, context: false },
        ],
      },
      continueSearchOnFail: 'true',
    },
  ]
  testCases.forEach((testCase) => {
    it(`should return ${JSON.stringify(
      testCase.expectedOutput,
    )} when called with ${JSON.stringify(testCase.input)} and "${
      testCase.condition
    }" continue search on fail set to "${
      testCase.continueSearchOnFail
    }"`, () => {
      vi.stubEnv('CONTINUE_SEARCH_ON_FAIL', testCase.continueSearchOnFail)
      const result = all(testCase.input, testCase.condition)
      expect(result).toEqual(testCase.expectedOutput)
    })
  })
})

describe('any', () => {
  const testCases = [
    {
      input: [{ foo: 'bar' }, { qux: 'quux' }, { foo: 'baz' }],
      condition: '$.foo !== undefined',
      expectedOutput: { result: true },
    },
    {
      input: [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'baz' }],
      condition: '$.foo === "quux"',
      expectedOutput: {
        result: false,
        reasonPackage: [
          { reasons: ['bar'], context: { foo: 'bar' } },
          { reasons: ['baz'], context: { foo: 'baz' } },
          { reasons: ['baz'], context: { foo: 'baz' } },
        ],
      },
    },
    {
      input: [null, undefined, false],
      condition: '$.foo !== "nothing"',
      expectedOutput: { result: false, reasonPackage: [] },
    },
  ]
  testCases.forEach((testCase) => {
    it(`should return ${JSON.stringify(
      testCase.expectedOutput,
    )} when called with ${JSON.stringify(testCase.input)} and "${
      testCase.condition
    }"`, () => {
      const result = any(testCase.input, testCase.condition)
      expect(result).toEqual(testCase.expectedOutput)
    })
  })
})

describe('one', () => {
  const testCases = [
    {
      input: [{ foo: 'bar' }, { qux: 'quux' }, { foo: 'baz' }],
      condition: '$.foo === "bar"',
      expectedOutput: { result: true },
      continueSearchOnFail: 'false',
    },
    {
      input: [{ foo: 'bar' }, { foo: 'bar' }, { foo: 'bar' }],
      condition: '$.foo === "baz"',
      expectedOutput: {
        result: false,
        reasonPackage: [
          { reasons: ['bar'], context: { foo: 'bar' } },
          { reasons: ['bar'], context: { foo: 'bar' } },
          { reasons: ['bar'], context: { foo: 'bar' } },
        ],
      },
      continueSearchOnFail: 'false',
    },
    {
      input: [{ foo: 'bar' }, { foo: 'bar' }, { foo: 'baz' }],
      condition: '$.foo === "bar"',
      expectedOutput: {
        result: false,
        reasonPackage: [
          { reasons: ['bar'], context: { foo: 'bar' } },
          { reasons: ['bar'], context: { foo: 'bar' } },
        ],
      },
      continueSearchOnFail: 'false',
    },
    {
      input: [null, undefined, false],
      condition: '$.foo === "nothing"',
      expectedOutput: {
        result: false,
        reasonPackage: [
          { reasons: null, context: null },
          { reasons: undefined, context: undefined },
          { reasons: false, context: false },
        ],
      },
      continueSearchOnFail: 'false',
    },
    {
      input: [{ foo: 'bar' }, { foo: 'bar' }, { foo: 'bar' }],
      condition: '$.foo === "bar"',
      expectedOutput: {
        result: false,
        reasonPackage: [
          { reasons: ['bar'], context: { foo: 'bar' } },
          { reasons: ['bar'], context: { foo: 'bar' } },
          { reasons: ['bar'], context: { foo: 'bar' } },
        ],
      },
      continueSearchOnFail: 'true',
    },
  ]
  testCases.forEach((testCase) => {
    it(`should return ${JSON.stringify(
      testCase.expectedOutput,
    )} when called with ${JSON.stringify(testCase.input)} and "${
      testCase.condition
    }"`, () => {
      vi.stubEnv('CONTINUE_SEARCH_ON_FAIL', testCase.continueSearchOnFail)
      const result = one(testCase.input, testCase.condition)
      expect(result).toEqual(testCase.expectedOutput)
    })
  })
})

describe('none', () => {
  const testCases = [
    {
      input: [],
      condition: '$.foo === "bar"',
      expectedOutput: { result: true },
      continueSearchOnFail: 'false',
    },
    {
      input: [{ foo: 'bar' }, { foo: 'baz' }],
      condition: '$.foo === "quux"',
      expectedOutput: { result: true },
      continueSearchOnFail: 'false',
    },
    {
      input: [{ foo: 'bar' }, { foo: 'baz' }],
      condition: '$.foo === "bar"',
      expectedOutput: {
        result: false,
        reasonPackage: [{ reasons: ['bar'], context: { foo: 'bar' } }],
      },
      continueSearchOnFail: 'false',
    },
    {
      input: [{ foo: 'baz' }, { foo: 'bar' }],
      condition: '$.foo === "bar"',
      expectedOutput: {
        result: false,
        reasonPackage: [{ reasons: ['bar'], context: { foo: 'bar' } }],
      },
      continueSearchOnFail: 'false',
    },
    {
      input: [{ foo: 'baz' }, null, { foo: 'qux' }],
      condition: '$.foo === "bar"',
      expectedOutput: { result: true },
      continueSearchOnFail: 'false',
    },
    {
      input: [null, undefined, false],
      condition: '$.foo === "bar"',
      expectedOutput: { result: true },
      continueSearchOnFail: 'false',
    },
    {
      input: [{ foo: 'bar' }, { foo: 'bar' }],
      condition: '$.foo === "bar"',
      expectedOutput: {
        result: false,
        reasonPackage: [
          { reasons: ['bar'], context: { foo: 'bar' } },
          { reasons: ['bar'], context: { foo: 'bar' } },
        ],
      },
      continueSearchOnFail: 'true',
    },
  ]
  testCases.forEach((testCase) => {
    it(`should return ${JSON.stringify(
      testCase.expectedOutput,
    )} when called with ${JSON.stringify(testCase.input)} and "${
      testCase.condition
    }"`, () => {
      vi.stubEnv('CONTINUE_SEARCH_ON_FAIL', testCase.continueSearchOnFail)
      const result = none(testCase.input, testCase.condition)
      expect(result).toEqual(testCase.expectedOutput)
    })
  })
})

describe('evaluateConcatenationCondition', () => {
  const testCases = [
    {
      condition: 'GREEN && YELLOW',
      expectedOutput: 'YELLOW',
    },
    {
      condition: 'GREEN && YELLOW && RED',
      expectedOutput: 'RED',
    },
    {
      condition: '(GREEN && YELLOW) || RED',
      expectedOutput: 'YELLOW',
    },
    {
      condition: 'GREEN && (YELLOW || RED)',
      expectedOutput: 'YELLOW',
    },
  ]
  testCases.forEach((testCase) => {
    it(`should return ${testCase.expectedOutput} when called with ${testCase.condition}`, () => {
      const result = evaluateConcatenationCondition(testCase.condition)
      expect(result).toEqual(testCase.expectedOutput)
    })
  })
})
