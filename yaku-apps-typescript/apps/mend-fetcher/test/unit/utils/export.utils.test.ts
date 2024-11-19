// SPDX-FileCopyrightText: 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { afterEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'fs/promises'
import * as fs_sync from 'fs'
import * as utils from '../../../src/utils/export'

describe('export.utils', () => {
  vi.mock('fs/promises')
  vi.mock('fs')

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('should write JSON content to a file into an exising directory', async () => {
    const spyExistsSync = vi.spyOn(fs_sync, 'existsSync')
    spyExistsSync.mockImplementation(() => false)
    const content = { content: 'content' }

    expect.assertions(2)
    await utils.exportJson(content, '/tmp/content.json')

    expect(fs_sync.mkdirSync).toHaveBeenCalled()
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/tmp/content.json',
      JSON.stringify(content)
    )
  })

  it('should write JSON content to a file into a non-exising directory', async () => {
    const spyExistsSync = vi.spyOn(fs_sync, 'existsSync')
    spyExistsSync.mockImplementation(() => true)
    const content = { content: 'content' }

    expect.assertions(1)
    await utils.exportJson(content, '/tmp/content.json')

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/tmp/content.json',
      JSON.stringify(content)
    )
  })
})
