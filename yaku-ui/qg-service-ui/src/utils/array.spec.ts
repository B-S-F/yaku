// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { getElementOrFirstInArray, uniqueBy } from './array'

describe('array', () => {
  describe('uniqueBy', () => {
    it('remove one duplicate object', () => {
      const payload = [{ id: '1' }, { id: '1' }, { id: '2' }]
      expect(uniqueBy(payload, 'id')).toStrictEqual([{ id: '1' }, { id: '2' }])
    })

    it('remove multiple duplicates', () => {
      const payload = [{ id: '1' }, { id: '1' }, { id: '2' }, { id: '2' }]
      expect(uniqueBy(payload, 'id')).toStrictEqual([{ id: '1' }, { id: '2' }])
    })
  })

  describe('getElementOrFirstInArray', () => {
    it('get the first array element', () => {
      expect(getElementOrFirstInArray([1, 2, 3])).toStrictEqual(1)
    })

    it('get the first element', () => {
      expect(getElementOrFirstInArray(1)).toStrictEqual(1)
    })
  })
})
