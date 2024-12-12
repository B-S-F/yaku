// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import {
  getSheetColumnNameFromIndex,
  sheetColumnNameIterator,
} from './sheetColumnName'

describe('getSheetColumnName', () => {
  it('returns the first letter first', () => {
    expect(sheetColumnNameIterator().next().value).toBe('A')
  })

  it('returns the 26th case Z', () => {
    const it = sheetColumnNameIterator()
    for (let i = 0; i < 25; i++) it.next()
    expect(it.next().value).toBe('Z')
  })

  it('returns the 27th case AA', () => {
    const it = sheetColumnNameIterator()
    for (let i = 0; i < 26; i++) it.next()
    expect(it.next().value).toBe('AA')
  })

  it('returns the 28th case AB', () => {
    const it = sheetColumnNameIterator()
    for (let i = 0; i < 27; i++) it.next()
    expect(it.next().value).toBe('AB')
  })

  it('returns the 52th case AA', () => {
    const it = sheetColumnNameIterator()
    for (let i = 0; i < 51; i++) it.next()
    expect(it.next().value).toBe('AZ')
  })

  it('returns the 52th case AA', () => {
    const it = sheetColumnNameIterator()
    for (let i = 0; i < 52; i++) it.next()
    expect(it.next().value).toBe('BA')
  })

  it('returns the 104th case AA', () => {
    const it = sheetColumnNameIterator()
    for (let i = 0; i < 104; i++) it.next()
    expect(it.next().value).toBe('DA')
  })

  it('returns the 675th case ZA', () => {
    const it = sheetColumnNameIterator()
    for (let i = 0; i < 675; i++) it.next()
    expect(it.next().value).toBe('YZ')
  })

  it('returns the 676th case ZA', () => {
    const it = sheetColumnNameIterator()
    for (let i = 0; i < 676; i++) it.next()
    expect(it.next().value).toBe('ZA')
  })

  it('returns the 677th case ZA', () => {
    const it = sheetColumnNameIterator()
    for (let i = 0; i < 677; i++) it.next()
    expect(it.next().value).toBe('ZB')
  })

  it('returns the 702th case AAA', () => {
    const it = sheetColumnNameIterator()
    for (let i = 0; i < 702; i++) it.next()
    expect(it.next().value).toBe('AAA')
  })
})

describe('getSheetColumnNameFromIndex', () => {
  it('returns the first letter first', () => {
    expect(getSheetColumnNameFromIndex(0)).toBe('A')
  })

  it('returns the 26th case Z', () => {
    expect(getSheetColumnNameFromIndex(25)).toBe('Z')
  })

  it('returns the 27th case AA', () => {
    expect(getSheetColumnNameFromIndex(26)).toBe('AA')
  })

  it('returns the 702th case AAA', () => {
    expect(getSheetColumnNameFromIndex(702)).toBe('AAA')
  })
})
