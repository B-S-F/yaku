// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import yp from './yaku-prompts.js'
import { jest } from '@jest/globals'
import cp, { ChildProcess } from 'child_process'

describe('confirm()', () => {
  it('should return the resolved value', async () => {
    const result = yp.confirm('tes')

    // resolve the promise
    process.stdin.emit('keypress', 'y', {})
    process.stdin.emit('keypress', '', { name: 'return' })

    expect(result).resolves.toBe(true)
  })
})

describe('input()', () => {
  it('should return the resolved value', async () => {
    const result = yp.input('test')

    // resolve the promise
    process.stdin.emit('keypress', 'y', {})
    process.stdin.emit('keypress', '', { name: 'return' })

    expect(result).resolves.toBe('y')
  })
})

describe('select()', () => {
  it('should return the resolved value', async () => {
    const result = yp.select('test', [{ name: 'name', value: 'value' }])

    // resolve the promise
    process.stdin.emit('keypress', '', { name: 'return' })

    expect(result).resolves.toBe('value')
  })
})

describe('search()', () => {
  it('should return the resolved value', async () => {
    const result = yp.search('test', [{ name: 'name', value: 'value' }])

    // resolve the promise
    process.stdin.emit('keypress', '', { name: 'return' })

    expect(result).resolves.toBe('value')
  })
})

describe('createTablePrompt()', () => {
  it('should return the resolved value', async () => {
    const result = yp.createTablePrompt({
      message: 'test',
      columns: [{ name: 'Name', value: 'name', editable: 'text' }],
      rows: [['test']],
    })

    // resolve the promise
    process.stdin.emit('keypress', '', { name: 'return' })
    process.stdin.emit('keypress', '', { name: 'return' })

    expect(result).resolves.toEqual([['test']])
  })
})

describe('openFileInEditor()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })
  it('should open file in env configured editor', async () => {
    const testFilename = 'testFilename'
    const testEditor = 'dummyVi'
    const spawnSpy = jest
      .spyOn(cp, 'spawn')
      .mockImplementation(
        (
          command: string,
          args: readonly string[],
          options: cp.SpawnOptions,
        ) => {
          return new ChildProcess()
        },
      )

    await yp.openFileInEditor(testFilename, testEditor)

    expect(spawnSpy).toHaveBeenCalledWith(testEditor, [testFilename], {
      stdio: 'inherit',
    })
  })
})
