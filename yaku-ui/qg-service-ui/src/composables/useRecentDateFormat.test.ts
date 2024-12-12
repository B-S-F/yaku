// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, beforeEach, vi, expect } from 'vitest'
import { useRecentDateFormat } from './useRecentDateFormat'

describe('useRecentDateFormat', () => {
  beforeEach(() => {
    vi.setSystemTime('2023-01-16T00:00:00.000Z')
  })

  it('returns "moment ago" if less than a minute', () => {
    const d = new Date('2023-01-15T23:59:30.000Z')
    expect(useRecentDateFormat(d)).toStrictEqual('one moment ago')
  })

  it('returns "minute ago" (singular) if between 1 and 2 minutes', () => {
    const d = new Date('2023-01-15T23:58:59.000Z')
    expect(useRecentDateFormat(d)).toStrictEqual('1 minute ago')
  })

  it('returns "minutes ago" if less than an hour', () => {
    const d = new Date('2023-01-15T23:56:29.000Z')
    expect(useRecentDateFormat(d)).toStrictEqual('3 minutes ago')
  })

  it('returns "hour ago" (singular) if less than two hours', () => {
    const d = new Date('2023-01-15T23:00:00.000Z')
    expect(useRecentDateFormat(d)).toStrictEqual('1 hour ago')
  })

  it('returns "hours ago" if less than a day', () => {
    const d = new Date('2023-01-15T12:00:00.000Z')
    expect(useRecentDateFormat(d)).toStrictEqual('12 hours ago')
  })

  it('returns date string if more than a day', () => {
    const d = new Date('2023-01-12T00:00:00.000Z')
    expect(useRecentDateFormat(d)).toStrictEqual('12.01.2023, 00:00')
  })

  it('returns a full date string if forcing it', () => {
    const d = new Date('2023-01-15T23:59:30.000Z')
    expect(useRecentDateFormat(d, { forceDateString: true })).toStrictEqual(
      '15.01.2023, 23:59',
    )
  })
})
