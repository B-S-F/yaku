// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { loginToken } from './token-auth'

describe('loginToken()', () => {
  it('should return an environment', () => {
    const token = 'token'
    const envName = 'envName'
    const url = 'http://dot.com'
    expect(loginToken(token, envName, url)).resolves.toEqual({
      name: envName,
      url: url,
      accessToken: token,
      current: true,
    })
  })
})
