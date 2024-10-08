import { jest } from '@jest/globals'
import { SpiedFunction } from 'jest-mock'
import { YakuTableInput } from './yaku-table-input'
import { Answers } from 'inquirer'
import readline, { Interface } from 'node:readline'
import { Readable } from 'node:stream'

/**
 * A typical Choice object looks like this:
 * Choice {
 *   '0': 'x',
 *   '1': 'text2',
 *   '2': 'http://dot2.com/api/v1',
 *   '3': '2',
 *   '4': '2',
 *   name: undefined,
 *   value: undefined,
 *   short: undefined,
 *   disabled: undefined
 * }
 * In order to be able to access the undeclared attributes, such as '0', '1', ..., we use a JSON hack to 'de-class' the Choice[]
 * @param table instance of YakuTableInput
 * @param pointer row
 * @param horizontalPointer column
 * @returns value of the intended choice
 */
function getChoiceValue(
  table: YakuTableInput,
  pointer: number,
  horizontalPointer: number
) {
  return JSON.parse(JSON.stringify(table.rows.choices))[pointer][
    horizontalPointer
  ]
}

describe('YakuTableInput', () => {
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
  const allChars =
    '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/?'
  let questions: any
  let rl: Interface
  let answers: Answers
  let renderSpy: SpiedFunction
  let formatCellSpy: SpiedFunction
  let updateEditingSpy: SpiedFunction

  beforeEach(() => {
    questions = {
      type: 'table-input',
      name: 'environments',
      message: 'Environments',
      infoMessage: `Navigate and Edit`,
      hideInfoWhenKeyPressed: true,
      freezeColumns: 1,
      columns: columns,
      rows: rows,
      validate: () => false,
    }
    rl = readline.createInterface({
      input: Readable.from([]),
      output: {
        unmute: jest.fn(),
      } as any,
    })
    answers = {}

    renderSpy = jest
      .spyOn(YakuTableInput.prototype, 'render')
      .mockImplementation((content, bottomContent) => {
        return undefined
      })
    updateEditingSpy = jest
      .spyOn(YakuTableInput.prototype, 'updateEditing')
      .mockImplementation(() => {
        return false
      })
    formatCellSpy = jest.spyOn(YakuTableInput.prototype, 'formatCell')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('run()', () => {
    it('should return the Promise of super call', () => {
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)

      const result = table.run()

      expect(result instanceof Promise).toBe(true)
    })
  })

  describe('_run()', () => {
    it('should bind events and render', () => {
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)
      // before _run(), only 'close' event shold be registered (default)
      expect(rl.eventNames()).toStrictEqual(['close'])

      const result = table._run(() => {
        return undefined
      })

      expect(result).toBe(table)
      expect(table.pointer).toBe(0)
      expect(table.horizontalPointer).toBe(1)
      expect(renderSpy).toHaveBeenCalled()
      // after _run(), the 'line' event should be added
      expect(rl.eventNames()).toStrictEqual(['close', 'line'])
    })
  })

  describe('onTabKey()', () => {
    it('should move the pointer to the right in the same row', () => {
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)
      table.horizontalPointer = 1
      table.pointer = 0

      table.onTabKey()

      expect(table.horizontalPointer).toBe(2)
      expect(table.pointer).toBe(0)
      expect(renderSpy).toHaveBeenCalled()
    })
    it('should move the pointer to the left in the following row', () => {
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)
      table.horizontalPointer = 4
      table.pointer = 0

      table.onTabKey()

      expect(table.horizontalPointer).toBe(1)
      expect(table.pointer).toBe(1)
      expect(renderSpy).toHaveBeenCalled()
    })
    it('should move the pointer to the left in the first row', () => {
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)
      table.horizontalPointer = 4
      table.pointer = 1

      table.onTabKey()

      expect(table.horizontalPointer).toBe(1)
      expect(table.pointer).toBe(0)
      expect(renderSpy).toHaveBeenCalled()
    })
  })

  describe('onEditPress(key)', () => {
    it('should ignore "tab"', () => {
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)

      const result = table.onEditPress({
        name: 'tab',
      })

      expect(result).toBe(false)
      expect(formatCellSpy).not.toHaveBeenCalled()
      expect(updateEditingSpy).not.toHaveBeenCalled()
      expect(renderSpy).not.toHaveBeenCalled()
    })
    it('should reset value on "escape"', () => {
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)

      const result = table.onEditPress({
        name: 'escape',
      })

      expect(result).toBe(false)
      expect(formatCellSpy).not.toHaveBeenCalled()
      expect(updateEditingSpy).toHaveBeenCalled()
      expect(renderSpy).toHaveBeenCalled()
    })
    it('should reset contents on "delete"', () => {
      const originalVal = 'text1'
      const updatedVal = ''
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)
      table.horizontalPointer = 1
      table.pointer = 0
      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(originalVal)

      const result = table.onEditPress({
        name: 'delete',
      })

      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(updatedVal)
      expect(result).toBe(false)
      expect(formatCellSpy).toHaveBeenCalled()
      expect(updateEditingSpy).toHaveBeenCalled()
      expect(renderSpy).not.toHaveBeenCalled()
    })
    it('should update text contents on "backspace"', () => {
      const originalVal = 'text1'
      const updatedVal = 'text'
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)
      table.horizontalPointer = 1
      table.pointer = 0
      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(originalVal)

      const result = table.onEditPress({
        name: 'backspace',
      })

      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(updatedVal)
      expect(result).toBe(false)
      expect(formatCellSpy).not.toHaveBeenCalled()
      expect(updateEditingSpy).not.toHaveBeenCalled()
      expect(renderSpy).toHaveBeenCalled()
    })
    it('should update number contents on "backspace"', () => {
      const originalVal = '1'
      const updatedVal = 0
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)
      table.horizontalPointer = 3
      table.pointer = 0
      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(originalVal)

      const result = table.onEditPress({
        name: 'backspace',
      })

      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(updatedVal)
      expect(result).toBe(false)
      expect(formatCellSpy).toHaveBeenCalled()
      expect(updateEditingSpy).toHaveBeenCalled()
      expect(renderSpy).toHaveBeenCalled()
    })
    it('should update double contents on "backspace"', () => {
      const originalVal = '1'
      const updatedVal = '0.00'
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)
      table.horizontalPointer = 4
      table.pointer = 0
      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(originalVal)

      const result = table.onEditPress({
        name: 'backspace',
      })

      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(updatedVal)
      expect(result).toBe(false)
      expect(formatCellSpy).toHaveBeenCalled()
      expect(updateEditingSpy).toHaveBeenCalled()
      expect(renderSpy).toHaveBeenCalled()
    })
    it('should update text contents on keypress', () => {
      const originalVal = 'text1'
      const updatedVal =
        'text11234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM'
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)
      table.horizontalPointer = 1
      table.pointer = 0
      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(originalVal)

      // hit all keystrokes
      for (let i = 0; i < allChars.length; i++) {
        table.onEditPress({
          name: allChars[i],
          sequence: allChars[i],
        })
      }

      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(updatedVal)
      expect(formatCellSpy).not.toHaveBeenCalled()
      expect(updateEditingSpy).not.toHaveBeenCalled()
      expect(renderSpy).toHaveBeenCalledTimes(
        updatedVal.length - originalVal.length
      )
    })
    it('should update url contents on keypress', () => {
      const originalVal = 'http://dot1.com/api/v1'
      const updatedVal =
        'http://dot1.com/api/v11234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/?'
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)
      table.horizontalPointer = 2
      table.pointer = 0
      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(originalVal)

      // hit all keystrokes
      for (let i = 0; i < allChars.length; i++) {
        table.onEditPress({
          name: allChars[i],
          sequence: allChars[i],
        })
      }

      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(updatedVal)
      expect(formatCellSpy).not.toHaveBeenCalled()
      expect(updateEditingSpy).not.toHaveBeenCalled()
      expect(renderSpy).toHaveBeenCalledTimes(
        updatedVal.length - originalVal.length
      )
    })
    it('should update number contents on keypress', () => {
      const originalVal = '1'
      const updatedVal = '11234567890'
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)
      table.horizontalPointer = 3
      table.pointer = 0
      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(originalVal)

      // hit all keystrokes
      for (let i = 0; i < allChars.length; i++) {
        table.onEditPress({
          name: allChars[i],
          sequence: allChars[i],
        })
      }

      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(updatedVal)
      expect(formatCellSpy).not.toHaveBeenCalled()
      expect(updateEditingSpy).not.toHaveBeenCalled()
      expect(renderSpy).toHaveBeenCalledTimes(
        updatedVal.length - originalVal.length
      )
    })
    it('should update decimal contents on keypress', () => {
      const originalVal = '1'
      const updatedVal = '11234567890.'
      const table: YakuTableInput = new YakuTableInput(questions, rl, answers)
      table.horizontalPointer = 4
      table.pointer = 0
      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(originalVal)

      // hit all keystrokes
      for (let i = 0; i < allChars.length; i++) {
        table.onEditPress({
          name: allChars[i],
          sequence: allChars[i],
        })
      }

      expect(
        getChoiceValue(table, table.pointer, table.horizontalPointer)
      ).toBe(updatedVal)
      expect(formatCellSpy).not.toHaveBeenCalled()
      expect(updateEditingSpy).not.toHaveBeenCalled()
      expect(renderSpy).toHaveBeenCalledTimes(
        updatedVal.length - originalVal.length
      )
    })
  })
})
