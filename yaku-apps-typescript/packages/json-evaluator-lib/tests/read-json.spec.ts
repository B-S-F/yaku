// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { afterEach, describe, it, expect, vi } from 'vitest'

import { readJson } from '../src/read-json.js'

import { readFile } from 'fs/promises'

vi.mock('fs/promises')

class FileNotFoundError extends Error {
  code = 'ENOENT'
}

describe('readJson', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should read and parse a JSON file', async () => {
    vi.mocked(readFile).mockResolvedValueOnce(
      '{ "name": "John Doe", "age": 30 }'
    )

    const data = await readJson('./example.json')

    expect(data).toEqual({ name: 'John Doe', age: 30 })
  })

  it('should replace white spaces in keys with underscores', async () => {
    vi.mocked(readFile).mockResolvedValueOnce(
      '{ "first name": "John", "last name": "Doe", "age": 30 }'
    )

    const data = await readJson('./example_with_spaces.json')

    expect(data).toEqual({ first_name: 'John', last_name: 'Doe', age: 30 })
  })

  it('should throw an error if the file could not be parsed', async () => {
    vi.mocked(readFile).mockResolvedValueOnce('invalid json')

    await expect(readJson('./invalid.json')).rejects.toThrow(
      'File ./invalid.json could not be parsed, failed with error: SyntaxError: Unexpected token i in JSON at position 0'
    )
  })

  it('should throw an error if the file could not be found', async () => {
    const error = new FileNotFoundError('File not found')
    vi.mocked(readFile).mockRejectedValueOnce(error)

    await expect(readJson('./non_existing_file.json')).rejects.toThrow(
      'File ./non_existing_file.json does not exist'
    )
  })
})
