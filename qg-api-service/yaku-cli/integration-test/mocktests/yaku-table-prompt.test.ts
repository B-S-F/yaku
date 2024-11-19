// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, beforeEach, it, expect } from 'vitest'
import yakuTablePrompt from '../../src//extensions/yaku-table-prompt.js'
import { TableColumn } from '../../src/yaku-prompts.js'

const columns: TableColumn[] = [
  { name: '●', value: 'current', editable: 'radio' },
  { name: 'text', value: 'text', editable: 'text' },
  { name: 'url', value: 'url', editable: 'url' },
  { name: 'number', value: 'number', editable: 'number' },
  { name: 'decimal', value: 'decimal', editable: 'decimal' },
]

describe('Custom functions of YakuTableInput', () => {
  let rows
  beforeEach(() => {
    rows = [
      [false, 'text1', 'http://dot1.com/api/v1', '1', '1'],
      [true, 'text2', 'http://dot2.com/api/v1', '2', '2'],
    ]
  })
  it('Modify text without updating', async () => {
    const result = yakuTablePrompt({
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 2,
    }).then((result) => {
      return result
    })

    process.stdin.emit('keypress', '', { name: 'right' })
    // start editing (from empty row)
    process.stdin.emit('keypress', '', { name: 'delete' })

    // type the new value
    const strokes = ['b', '.', '[', 'l', 'a', '1']
    for (let i = 0; i < strokes.length; i++) {
      process.stdin.emit('keypress', '', { sequence: strokes[i] })
    }

    // exit editing and save changes
    for (let i = 0; i < 3; i++) {
      process.stdin.emit('keypress', '', { name: 'escape' })
    }

    await expect(result).resolves.toStrictEqual(undefined)
  })

  it('Modify text using delete', async () => {
    const result = yakuTablePrompt({
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 2,
    }).then((result) => {
      return result
    })

    // extra: use arrows to navigate to the first text cell, also validates that key navigation works correctly (by assuming the edited cell later on)
    const arrows = ['right', 'right', 'down', 'left', 'up']
    for (let i = 0; i < arrows.length; i++) {
      process.stdin.emit('keypress', '', { name: arrows[i] })
    }

    // start editing (from empty row)
    process.stdin.emit('keypress', '', { name: 'delete' })

    // type the new value
    const strokes = ['.', '[', 'a', 'b', '1']
    for (let i = 0; i < strokes.length; i++) {
      process.stdin.emit('keypress', strokes[i], {})
    }

    // exit editing and save changes
    for (let i = 0; i < 3; i++) {
      process.stdin.emit('keypress', '', { name: 'enter' })
    }

    await expect(result).resolves.toStrictEqual([
      [false, 'ab1', 'http://dot1.com/api/v1', '1', '1'],
      [true, 'text2', 'http://dot2.com/api/v1', '2', '2'],
    ])
  })

  it('Modify url using tab and insert special characters', async () => {
    const result = yakuTablePrompt({
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 2,
    }).then((result) => {
      return result
    })

    // extra: use tabs should circle through the whole table back to cell 0, also validates that tab navigation works correctly (by assuming the edited cell later on)
    for (let i = 0; i < 10; i++) {
      process.stdin.emit('keypress', '', { name: 'tab' })
    }

    // navigate to second column, first row
    process.stdin.emit('keypress', '', { name: 'tab' })
    process.stdin.emit('keypress', '', { name: 'tab' })

    // start editing
    process.stdin.emit('keypress', '', { name: 'insert' })

    // remove all characters with backspace
    for (let i = 0; i < String(rows[0][2]).length; i++) {
      process.stdin.emit('keypress', '', { name: 'backspace' })
    }
    const series = [
      'a',
      ':',
      '2',
      '`',
      '~',
      '!',
      '@',
      '#',
      '$',
      '%',
      '^',
      '&',
      '*',
      '(',
      ')',
      '-',
      '_',
      '=',
      '+',
      '[',
      '{',
      ']',
      '}',
      '\\',
      '|',
      ';',
      "'",
      ',',
      '.',
      '/',
      '?',
    ]
    // type the sequence
    for (let i = 0; i < series.length; i++) {
      process.stdin.emit('keypress', series[i], {})
    }

    // exit editing and save changes
    for (let i = 0; i < 3; i++) {
      process.stdin.emit('keypress', '', { name: 'enter' })
    }

    await expect(result).resolves.toStrictEqual([
      [false, 'text1', "a:2`~!@#$%^&*()-_=+[{]}\\|;',./?", '1', '1'],
      [true, 'text2', 'http://dot2.com/api/v1', '2', '2'],
    ])
  })

  it('Modify number using delete', async () => {
    const result = yakuTablePrompt({
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 2,
    }).then((result) => {
      return result
    })

    // navigate to the number
    for (let i = 0; i < 3; i++) {
      process.stdin.emit('keypress', '', { name: 'right' })
    }

    // start editing by clearing the existing value
    process.stdin.emit('keypress', '', { name: 'delete' })

    // type the sequence ('33')
    for (let i = 0; i < 2; i++) {
      process.stdin.emit('keypress', '3', {})
    }

    // exit editing and save changes
    for (let i = 0; i < 3; i++) {
      process.stdin.emit('keypress', '', { name: 'enter' })
    }

    await expect(result).resolves.toStrictEqual([
      [false, 'text1', 'http://dot1.com/api/v1', '33', '1'],
      [true, 'text2', 'http://dot2.com/api/v1', '2', '2'],
    ])
  })

  it('Modify decimal using insert', async () => {
    const result = yakuTablePrompt({
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 2,
    }).then((result) => {
      return result
    })

    // navigate to the decimal
    for (let i = 0; i < 4; i++) {
      process.stdin.emit('keypress', '', { name: 'right' })
    }

    // start editing by clearing the existing value
    process.stdin.emit('keypress', '', { name: 'insert' })

    const sequence = ['3', '3', ',', '.', '3', '3']
    // type the sequence ('33')
    for (let i = 0; i < sequence.length; i++) {
      process.stdin.emit('keypress', sequence[i], {})
    }

    // exit editing and save changes
    for (let i = 0; i < 3; i++) {
      process.stdin.emit('keypress', '', { name: 'enter' })
    }

    await expect(result).resolves.toStrictEqual([
      [false, 'text1', 'http://dot1.com/api/v1', '1', '133.33'],
      [true, 'text2', 'http://dot2.com/api/v1', '2', '2'],
    ])
  })
  it('Modify radio using space', async () => {
    const result = yakuTablePrompt({
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 2,
    }).then((result) => {
      return result
    })

    // select the first element as current
    process.stdin.emit('keypress', '', { name: 'space' })

    // exit editing and save changes
    for (let i = 0; i < 3; i++) {
      process.stdin.emit('keypress', '', { name: 'enter' })
    }

    await expect(result).resolves.toStrictEqual([
      [true, 'text1', 'http://dot1.com/api/v1', '1', '1'],
      [false, 'text2', 'http://dot2.com/api/v1', '2', '2'],
    ])
  })
})
