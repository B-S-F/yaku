import { describe, it, expect } from 'vitest'
import { YakuTableInput } from '../../src/extensions/yaku-table-input.js'
import inquirer, { Answers, Question } from 'inquirer'

const columns = [
  { value: 'selected' },
  { value: 'text', editable: 'text' },
  { value: 'url', editable: 'url' },
  { value: 'number', editable: 'number' },
  { value: 'decimal', editable: 'decimal' },
]

const rows = [
  ['', 'text1', 'http://dot1.com/api/v1', '1', '1'],
  ['x', 'text2', 'http://dot2.com/api/v1', '2', '2'],
]

describe('Custom functions of YakuTableInput', () => {
  inquirer.registerPrompt('table-input', YakuTableInput)

  describe('Modify text without updating', () => {
    it('should not update the cell', async () => {
      const result = inquirer
        .prompt([
          {
            type: 'table-input',
            name: 'environments',
            hideInfoWhenKeyPressed: true,
            freezeColumns: 1,
            columns: columns,
            rows: rows,
            validate: () => false,
          },
        ])
        .then((answers) => {
          return { state: answers.environments.state }
        })

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

      await expect(result).resolves.toStrictEqual({ state: false })
    })
  })

  describe('Modify text using delete', () => {
    it('should update the cell', async () => {
      const result = inquirer
        .prompt([
          {
            type: 'table-input',
            name: 'environments',
            hideInfoWhenKeyPressed: true,
            freezeColumns: 1,
            columns: columns,
            rows: rows,
            validate: () => false,
          },
        ])
        .then((answers) => {
          return {
            state: answers.environments.state,
            text: answers.environments.result[0].text,
          }
        })

      // extra: use arrows to navigate back to cell 0, also validates that key navigation works correctly (by assuming the edited cell later on)
      const arrows = ['right', 'down', 'left', 'up']
      for (let i = 0; i < arrows.length; i++) {
        process.stdin.emit('keypress', '', { name: arrows[i] })
      }

      // start editing (from empty row)
      process.stdin.emit('keypress', '', { name: 'delete' })

      // type the new value
      const strokes = ['.', '[', 'a', 'b', '1']
      for (let i = 0; i < strokes.length; i++) {
        process.stdin.emit('keypress', '', { sequence: strokes[i] })
      }

      // exit editing and save changes
      for (let i = 0; i < 3; i++) {
        process.stdin.emit('keypress', '', { name: 'enter' })
      }

      await expect(result).resolves.toStrictEqual({ state: true, text: 'ab1' })
    })
  })

  describe('Modify url using tab and insert special characters', () => {
    it('should update the cell', async () => {
      const result = inquirer
        .prompt([
          {
            type: 'table-input',
            name: 'environments',
            hideInfoWhenKeyPressed: true,
            freezeColumns: 1,
            columns: columns,
            rows: rows,
            validate: () => false,
          },
        ])
        .then((answers) => {
          return {
            state: answers.environments.state,
            url: answers.environments.result[0].url,
          }
        })

      // extra: use tabs should circle through the whole table back to cell 0, also validates that tab navigation works correctly (by assuming the edited cell later on)
      for (let i = 0; i < 8; i++) {
        process.stdin.emit('keypress', '', { name: 'tab' })
      }

      // navigate to second column, first row
      process.stdin.emit('keypress', '', { name: 'tab' })

      // start editing
      process.stdin.emit('keypress', '', { name: 'insert' })

      // remove all characters with ESC
      for (let i = 0; i < rows[1][2].length; i++) {
        process.stdin.emit('keypress', '', { name: 'backspace' })
      }
      const series = [
        // text
        'a',
        '2',
        // all special characters
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
        ':',
        "'",
        '"',
        ',',
        '<',
        '.',
        '>',
        '/',
        '?',
      ]
      // type the sequence
      for (let i = 0; i < series.length; i++) {
        process.stdin.emit('keypress', '', { sequence: series[i] })
      }

      // exit editing and save changes
      for (let i = 0; i < 3; i++) {
        process.stdin.emit('keypress', '', { name: 'enter' })
      }

      await expect(result).resolves.toStrictEqual({
        state: true,
        url: 'a2`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/?',
      })
    })
  })

  describe('Modify number using typing', () => {
    it('should update the cell', async () => {
      const result = inquirer
        .prompt([
          {
            type: 'table-input',
            name: 'environments',
            hideInfoWhenKeyPressed: true,
            freezeColumns: 1,
            columns: columns,
            rows: rows,
            validate: () => false,
          },
        ])
        .then((answers) => {
          return {
            state: answers.environments.state,
            number: answers.environments.result[0].number,
          }
        })

      const series = [
        // navigate to column
        'right',
        'right',
        // start editing (directly with the new value)
        '3',
        '3',
        // exit editing and save changes
        'enter',
        'enter',
        'enter',
      ]
      for (let i = 0; i < series.length; i++) {
        process.stdin.emit('keypress', '', { name: series[i] })
      }

      await expect(result).resolves.toStrictEqual({ state: true, number: '33' })
    })
  })

  describe('Modify decimal using typing', () => {
    it('should update the cell', async () => {
      const result = inquirer
        .prompt([
          {
            type: 'table-input',
            name: 'environments',
            hideInfoWhenKeyPressed: true,
            freezeColumns: 1,
            columns: columns,
            rows: rows,
            validate: () => false,
          },
        ])
        .then((answers) => {
          return {
            state: answers.environments.state,
            decimal: answers.environments.result[0].decimal,
          }
        })

      const series = [
        // navigate to column
        'right',
        'tab',
        'right',
        // start editing (directly with the new value)
        '3',
        '3',
        '.',
        'backspace',
        ',',
        '3',
        '3',
        // exit editing and save changes
        'enter',
        'enter',
        'enter',
      ]

      for (let i = 0; i < series.length; i++) {
        process.stdin.emit(
          'keypress',
          '',
          series[i].length > 1 ? { name: series[i] } : { sequence: series[i] }
        )
      }

      await expect(result).resolves.toStrictEqual({
        state: true,
        decimal: '33.33',
      })
    })
  })
})
