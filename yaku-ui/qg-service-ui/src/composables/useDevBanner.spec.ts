// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { getUiVersion } from './useDevBanner'

describe('useDevBanner', () => {
  describe('getUiVersion', () => {
    const tests = [
      ['portal.bswf.tech', 'portal'],
      ['portal-dev.bswf.tech', 'dev'],
      ['portal-test.bswf.tech', 'test'],
      ['portal-qa.bswf.tech', 'qa'],
    ]

    tests.map((t) => {
      it(`${t[0]} -> ${t[1]}`, () => {
        expect(getUiVersion(t[0])).toStrictEqual(t[1])
      })
    })
  })
})
