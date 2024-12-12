// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { capitalizeFirstLetter } from './textFormatter'

describe('textFormatter', () => {
  it('capitalizeFirstLetter returns text with first letter capitalized, rest in lowercase', () => {
    expect(capitalizeFirstLetter('WARNinG')).toBe('Warning')
  })
})
