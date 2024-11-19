// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { config } from './config'

describe('config', () => {
  it('should contain version', () => {
    expect(config).toHaveProperty('version')
  })
})
