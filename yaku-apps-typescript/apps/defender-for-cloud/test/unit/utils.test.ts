// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { afterEach, vi, describe, it, expect } from 'vitest'
import * as fs from 'fs/promises'
import * as fs_sync from 'fs'
import { exportJson } from '../../src/utils'

describe('Test "exportJson()" from "utils.ts"', () => {
  vi.mock('fs')
  vi.mock('fs/promises')

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('Should write JSON content in a file from an existing directory', async () => {
    const existsSyncSpy = vi.spyOn(fs_sync, 'existsSync')
    existsSyncSpy.mockImplementation(() => false)

    const fileContent = { fileContent: 'fileContent' }

    expect.assertions(2)
    await exportJson(fileContent, '/tmp/results.json')

    expect(fs_sync.mkdirSync).toHaveBeenCalled()
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/tmp/results.json',
      JSON.stringify(fileContent)
    )
  })

  it('Should write JSON content in a file from an non-existing directory', async () => {
    const existsSyncSpy = vi.spyOn(fs_sync, 'existsSync')
    existsSyncSpy.mockImplementation(() => true)

    const fileContent = { fileContent: 'fileContent' }

    expect.assertions(1)
    await exportJson(fileContent, '/tmp/results.json')

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/tmp/results.json',
      JSON.stringify(fileContent)
    )
  })
})
