import { searchOnFail } from '../src/util'
import { describe, it, expect, vi } from 'vitest'

describe('validateLogLevel', () => {
  it('should return false when CONTINUE_SEARCH_ON_FAIL is "false"', () => {
    vi.stubEnv('CONTINUE_SEARCH_ON_FAIL', 'false')
    const result = searchOnFail()
    expect(result).toBe(false)
  })

  it('should return true when CONTINUE_SEARCH_ON_FAIL is "true"', () => {
    vi.stubEnv('CONTINUE_SEARCH_ON_FAIL', 'true')
    const result = searchOnFail()
    expect(result).toBe(true)
  })

  it('should return true when CONTINUE_SEARCH_ON_FAIL is "TRUE"', () => {
    vi.stubEnv('CONTINUE_SEARCH_ON_FAIL', 'TRUE')
    const result = searchOnFail()
    expect(result).toBe(true)
  })

  it('should throw an error when CONTINUE_SEARCH_ON_FAIL is not "true" or "false"', () => {
    vi.stubEnv('CONTINUE_SEARCH_ON_FAIL', 'INVALID')
    expect(() => {
      searchOnFail()
    }).toThrowError('CONTINUE_SEARCH_ON_FAIL: INVALID, is not valid!')
  })
})
