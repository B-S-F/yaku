/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */
import { describe, expect, it } from 'vitest'
import { getExpDate } from '../../src/utils/getExpDate'
const date = new Date('2030-01-01T00:00:00.000Z')
describe('getExpDate', () => {
  it('should get expiration date 1 day ahead', () => {
    const result = getExpDate(date, '1d')
    expect(result).toEqual(new Date('2030-01-02T00:00:00.000Z'))
  })
  it('should get expiration date 1 year and 1 day and 1 hour ahead', () => {
    const result = getExpDate(date, '1year 1day 1hour')
    // careful: 1 year = 365.25 days
    expect(result).toEqual(new Date('2031-01-02T07:00:00.000Z'))
  })
})
