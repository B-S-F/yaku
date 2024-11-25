// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createHeaders,
  createWiqlRequestBody,
} from '../../src/work-item/work-item'

describe('WorkItem', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('createHeaders() should return headers', () => {
    expect(createHeaders('Test')).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Basic OlRlc3Q=',
    })
  })

  it('createtWiqlRequestBody() should return wiqlRequestBody', () => {
    expect(createWiqlRequestBody('Test')).toEqual({
      query: 'Test',
    })
  })
})
