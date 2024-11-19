// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, it, expect, vi } from 'vitest'

import { readFile } from 'fs/promises'
import { readYamlData, parseConfig } from '../../src/parse-config'

vi.mock('fs/promises', () => ({
  readFile: vi.fn(() => 'foo: bar\n'),
}))

describe('readYamlData', async () => {
  it('should read and parse YAML file', async () => {
    const filePath = 'test.yaml'
    const expectedData = { foo: 'bar' }
    const data = await readYamlData(filePath)
    expect(data).toEqual(expectedData)
  })

  it('should throw error if YAML file could not be parsed', async () => {
    const filePath = 'test.yaml'
    const errorMsg = 'Error parsing YAML file'
    vi.mocked(readFile).mockRejectedValueOnce(new Error(errorMsg))
    await expect(readYamlData(filePath)).rejects.toThrow(
      `File ${filePath} could not be read, failed with error: Error: ${errorMsg}`,
    )
  })
})

describe('parseConfig', () => {
  it('should parse YAML file with valid schema', async () => {
    const filePath = 'test.yaml'
    const expectedConfig = {
      checks: [
        {
          name: 'Check1',
          ref: '$.prop1',
          condition: '$.prop1 === 1',
          true: 'GREEN',
        },
        {
          name: 'Check2',
          ref: '$.prop2',
          condition: '$.prop2 === "foo"',
          false: 'YELLOW',
        },
      ],
      concatenation: {
        condition: 'Check1 && Check2',
      },
    }
    const yamlContent = `
checks:
  - name: Check1
    ref: $.prop1
    condition: $.prop1 === 1
    true: GREEN
  - name: Check2
    ref: $.prop2
    condition: $.prop2 === "foo"
    false: YELLOW
concatenation:
  condition: Check1 && Check2
`
    vi.mocked(readFile).mockResolvedValueOnce(yamlContent)
    const config = await parseConfig(filePath)
    expect(config).toEqual(expectedConfig)
  })

  it('should throw error if YAML file has invalid schema', async () => {
    const filePath = 'test.yaml'
    vi.mocked(readFile).mockResolvedValueOnce('invalid_yaml')
    await expect(parseConfig(filePath)).rejects.toThrow(
      'Code: invalid_type ~ Path:  ~ Message: Expected object, received string',
    )
  })

  it('should throw error YAML file has invalid schema at a property', async () => {
    const yamlContent = `
checks:
  - names: Check1
    ref: .prop1
    condition: $.prop1 === 1
    test: nope
`
    const filePath = 'test.yaml'
    vi.mocked(readFile).mockResolvedValueOnce(yamlContent)
    await expect(parseConfig(filePath)).rejects.toThrow(
      "Code: invalid_type ~ Path: checks[0].name ~ Message: Required | Code: invalid_string ~ Path: checks[0].ref ~ Message: Invalid input: must start with \"$\" | Code: unrecognized_keys ~ Path: checks[0] ~ Message: Unrecognized key(s) in object: 'names', 'test'",
    )
  })
})
