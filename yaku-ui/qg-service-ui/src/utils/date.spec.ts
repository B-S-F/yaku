// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { getHumanDateTime } from './date'

describe('getHumanDate', () => {
  it('returns a - when a wrong date is given', () => {
    const wrongArgs = ['-', undefined, null, '', ' '] as any[]
    wrongArgs.forEach((arg) => expect(getHumanDateTime(arg)).toBe('-'))
  })

  it('returns a dd.mm.yyyy when a right date string is given', () => {
    const date = '2024-01-01T23:00:00.000Z'
    expect(getHumanDateTime(date)).toBe('01.01.24')
  })

  it('returns a dd.mm.yyyy, hh:mm when a right date string is given', () => {
    const date = '2024-01-01T23:00:00.000Z'
    expect(getHumanDateTime(date, true)).toBe('01.01.24, 23:00')
  })
})
