// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { validateExpDate } from '../../src/utils/validateExpDate'

describe('validateExpDate', () => {
  beforeEach(() => {
    process.env.expiry_reminder_period = ''
    vi.resetModules()
  })
  it('should return red if date is expired', () => {
    const expirationDate = new Date('2020-03-24T13:51:25.061+0100')
    const result = validateExpDate(expirationDate)
    expect(result).toEqual('RED')
  })

  it('should return yellow if expiration date is within the next default 14 days', () => {
    const today = new Date()
    const date14Days = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    const result = validateExpDate(date14Days)
    expect(result).toEqual('YELLOW')
  })

  it('should return yellow if expiration date is within the next 16 days', () => {
    process.env.expiry_reminder_period = '16d'
    const today = new Date()
    const date16Days = new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000)
    const result = validateExpDate(date16Days)
    expect(result).toEqual('YELLOW')
  })

  it('should return green if expiration date is more than default 14 days in the future', () => {
    const today = new Date()
    const date15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)
    const result = validateExpDate(date15Days)
    expect(result).toEqual('GREEN')
  })
})
