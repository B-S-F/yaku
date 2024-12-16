// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { copySecret } from './getCodeFromSecret'

describe('Copy code from secret', () => {
  it('returns an empty string if an empty string is passed', () => {
    expect(copySecret('')).toBe('')
  })

  it('Returns the right secret key', () => {
    const secretPath = 'SECRET_PATH'
    expect(copySecret(secretPath)).toBe('${{ secrets.SECRET_PATH }}')
  })
})
