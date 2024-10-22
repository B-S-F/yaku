import { describe, it, expect, vi, afterEach } from 'vitest'

import {
  colorStatusString,
  parseReasons,
  printCheckResult,
  stringifyFirstLevel,
} from '../../src/print'
import { Status } from '../../src/types'

describe('stringifyFirstLevel', () => {
  it('should return an empty object string when given an empty object', () => {
    const obj = {}
    const result = stringifyFirstLevel(obj)
    expect(result).toBe('{}')
  })

  it('should stringify a first-level object with primitive values correctly', () => {
    const obj = {
      foo: 'bar',
      baz: 123,
      qux: true,
    }
    const result = stringifyFirstLevel(obj)
    expect(result).toBe('{"foo":"bar","baz":123,"qux":true}')
  })

  it('should replace first-level object values with their type as a placeholder', () => {
    const obj = {
      foo: { bar: 'baz' },
      qux: [1, 2, 3],
      baz: null,
      quux: undefined,
    }
    const result = stringifyFirstLevel(obj)
    expect(result).toBe('{"foo":"<object>","qux":"<object>","baz":null}')
  })

  it('should not modify the original object', () => {
    const obj = {
      foo: { bar: 'baz' },
      qux: [1, 2, 3],
    }
    const result = stringifyFirstLevel(obj)
    expect(result).toBe('{"foo":"<object>","qux":"<object>"}')
    expect(obj).toEqual({ foo: { bar: 'baz' }, qux: [1, 2, 3] })
  })
})

describe('parseReasons function', () => {
  it('should return a reasonPackage with reasons being an array of strings and context a string when passed a reasonPackage with context containing non-object values and reasons contianing objects', () => {
    const reasons = [
      { foo: 'bar', baz: 'qux' },
      { foo: 'bar', baz: 'quux' },
    ]
    const context = 42
    const reasonPackage = { reasons, context }
    const resultingReasonPackage = {
      reasons: ['{"foo":"bar","baz":"qux"}', '{"foo":"bar","baz":"quux"}'],
      context: '42',
    }

    const parsedReasons = parseReasons(reasonPackage)
    expect(parsedReasons).toEqual(resultingReasonPackage)
  })

  it('should return a reasonPackage with all reasons and context as strings when passed a reasonPackage with reasons and context as an array of non-object values', () => {
    const reasonPackage = { reasons: ['foo', 'bar', 42], context: 42 }
    const resultingReasonPackage = {
      reasons: ['"foo"', '"bar"', '42'],
      context: '42',
    }

    const parsedReasons = parseReasons(reasonPackage)
    expect(parsedReasons).toEqual(resultingReasonPackage)
  })

  it('should return an empty reasonPackage when passed an empty reasonPackage', () => {
    const reasonPackage = { reasons: [], context: undefined }
    const parsedReasons = parseReasons(reasonPackage)
    expect(parsedReasons).toEqual(reasonPackage)
  })
})

describe('colorStatusString', () => {
  it('should color string red', () => {
    const str = 'RED'
    expect(colorStatusString(str)).toBe('RED'.red)
  })

  it('should color string green', () => {
    const str = 'GREEN'
    expect(colorStatusString(str)).toBe('GREEN'.green)
  })

  it('should color string yellow', () => {
    const str = 'YELLOW'
    expect(colorStatusString(str)).toBe('YELLOW'.yellow)
  })

  it('should not color other strings', () => {
    const str = 'some other string'
    expect(colorStatusString(str)).toBe(str)
  })
})

describe('printCheckResult', () => {
  afterEach(() => {
    vi.spyOn(console, 'log').mockRestore()
  })
  it('prints check result with all fields', () => {
    const check = {
      ref: '123456',
      condition: 'A condition',
      bool: true,
      status: 'SUCCESS' as Status,
      reasonPackage: { reasons: ['A reason'], context: undefined },
    }

    const expectedOutput = [
      ['\nCHECK NAME\n----------'],
      ['* **ref**: ' + '123456'.blue],
      ['* **condition**: ' + 'A condition'.blue],
      ['* **result**: ' + 'true'.blue],
      ['* **status**: ' + 'SUCCESS'],
      ['* **reasons**: ' + '"A reason"'],
    ]
    const consoleSpy = vi.spyOn(console, 'log')
    printCheckResult('check name', check)
    expect(consoleSpy.mock.calls).toEqual(expectedOutput)
  })

  it('prints check result without optional fields', () => {
    const check = {
      condition: 'A condition',
      status: 'FAILED' as Status,
    }
    const expectedOutput = [
      ['\nCHECK NAME\n----------'],
      ['* **condition**: ' + 'A condition'.blue],
      ['* **status**: ' + 'FAILED'],
    ]
    const consoleSpy = vi.spyOn(console, 'log')
    printCheckResult('check name', check)
    expect(consoleSpy.mock.calls).toEqual(expectedOutput)
  })
})
