/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { generatePropertyOutput, generateGlobalOutput } from '../src/output'

describe('generatePropertyOutput()', () => {
  it('should return output for each property', () => {
    const invalidPropertiesOutputList = [
      'property output 1',
      'property output 2',
    ]
    const expectedOutput =
      `Result for property \`property\`:\n` +
      ` * ${invalidPropertiesOutputList[0]}\n` +
      ` * ${invalidPropertiesOutputList[1]}\n`
    const output = generatePropertyOutput(
      'property',
      invalidPropertiesOutputList
    )
    expect(output).toEqual(expectedOutput)
  })

  it('should return empty string if there are no invalid properties', () => {
    const invalidPropertiesOutput = []
    const expectedOutput = ''
    const output = generatePropertyOutput('property', invalidPropertiesOutput)
    expect(output).toEqual(expectedOutput)
  })
})

describe('generateGlobalOutput()', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('should return GREEN status', () => {
    const outputs = ['Results from level 1:', 'All work items are valid']
    const spyConsole = vi.spyOn(console, 'log')
    generateGlobalOutput(outputs)
    expect(spyConsole).toHaveBeenCalledWith(
      '{"status":"GREEN","reason":"Results from level 1:\\nAll work items are valid"}'
    )
  })

  it('should return RED status', () => {
    const outputs = ['Results from level 1:', 'Some work items are invalid']
    const spyConsole = vi.spyOn(console, 'log')
    generateGlobalOutput(outputs)
    expect(spyConsole).toHaveBeenCalledWith(
      `{"status":"RED","reason":"Results from level 1:\\nSome work items are invalid"}`
    )
  })
})
