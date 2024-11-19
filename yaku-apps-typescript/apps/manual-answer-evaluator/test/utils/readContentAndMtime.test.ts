// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { beforeEach, describe, expect, it, SpyInstanceFn, vi } from 'vitest'
import { readContentAndMtime } from '../../src/utils/readContentAndMtime'
import { readFile, stat } from 'fs/promises'

describe('readContentAndMtime', () => {
  vi.mock('fs/promises')
  const mockReadFile = readFile as SpyInstanceFn
  const mockStat = stat as SpyInstanceFn

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should return object with content and mtime', async () => {
    mockReadFile.mockResolvedValue('content')
    mockStat.mockResolvedValue({ mtime: new Date('2020-01-01T00:00:00.000Z') })
    const result = await readContentAndMtime('filename')
    expect(result).toEqual({
      content: 'content',
      mtime: '2020-01-01T00:00:00.000Z',
    })
  })
})
