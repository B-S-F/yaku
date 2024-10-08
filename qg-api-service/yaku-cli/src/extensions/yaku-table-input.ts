/**
 * This class extends the module https://www.npmjs.com/package/inquirer-table-input (by Edelcio Molina <edelciomolina@gmail.com>) locally, so new editable types, such as 'url' can be introduced.
 * In order to accommodate for the types with custom rules (url-specific regexp), we need to override the 'onEditPress'.
 *
 * The original TableInput code can be found on the following locations:
 * - https://www.npmjs.com/package/inquirer-table-input?activeTab=code
 * - https://github.com/edelciomolina/inquirer-table-input/blob/main/index.js
 */

import TableInput from 'inquirer-table-input'
import inquirer, { Answers, Question } from 'inquirer'
import PromptState = inquirer.prompts.PromptState
import { Interface as ReadLineInterface } from 'readline'
import { Key } from 'node:readline'

import observe from 'inquirer/lib/utils/events.js'
import { map } from 'rxjs/operators'
import cliCursor from 'cli-cursor'

export class YakuTableInput extends TableInput {
  // we must define it locally or tsc would raise `Property 'status' is missing in type 'YakuTableInput' but required in type 'PromptBase'`
  status: PromptState

  constructor(questions: Question, rl: ReadLineInterface, answers: Answers) {
    super(questions, rl, answers)

    // we must initialize it or tsc would raise `Property 'status' has no initializer and is not definitely assigned in the constructor`
    this.status = 'pending'
  }
  // we must define it locally or tsc would raise `Property 'run' is missing in type 'YakuTableInput' but required in type 'PromptBase'`
  run() {
    return super.run()
  }

  /**
   * This method handles the key press events in select mode, and here is where we want to insert our tab-specific logic.
   * @param key
   */
  _run(callback: any) {
    this.done = callback

    const events = observe(this.rl)
    const validation = this.handleSubmitEvents(
      events.line.pipe(map(this.getCurrentValue.bind(this)))
    )
    validation.success.forEach(this.onEnd.bind(this))
    validation.error.forEach(this.onError.bind(this))

    events.keypress.forEach(({ key }) => {
      if (this.opt.hideInfoWhenKeyPressed) this.showInfo = false
      if (key.name !== 'escape') this.nextEscapeWillClose = false
      this.nextEnterWillConfirm = false

      if (!this.editingMode) {
        switch (key.name) {
          case 'tab': // our modification delagates the handling in the new method defined below
            return this.onTabKey()

          case 'down':
            return this.onDownKey()

          case 'up':
            return this.onUpKey()

          case 'left':
            return this.onLeftKey()

          case 'right':
            return this.onRightKey()

          case 'escape':
            if (!this.nextEscapeWillClose) {
              this.nextEscapeWillClose = true
              return this.render(this.opt.escapeMessage)
            } else {
              this.render()
              return this.onEnd(false)
            }

          default:
            if (this.columns.get(this.horizontalPointer).editable) {
              this.updateEditing()
              this.onEditPress(key)
            }
        }
      } else {
        return this.onEditPress(key)
      }
    })

    cliCursor.hide()
    this.render()

    return this
  }

  /**
   * create our own specific behavior (combined behavior inspired from onLeftKey + onDownKey)
   */
  onTabKey() {
    const horizontalLength = this.columns.realLength
    const verticalLength = this.rows.realLength

    if (this.horizontalPointer < horizontalLength - 1) {
      // move to the left if possible
      this.horizontalPointer = this.horizontalPointer + 1
    } else {
      // reset to first column if there is no more room on the left
      this.horizontalPointer = this.opt.freezeColumns
      if (this.pointer < verticalLength - 1) {
        // move down if possible
        this.pointer = this.pointer + 1
      } else {
        // reset to first row if there is no more room down
        this.pointer = 0
      }
    }
    this.render()
  }

  /**
   * This method handles the key press events in edit mode, and here is where we want to insert our url-specific logic. We have 4 modifications in total:
   * - 1. JS to TS for the existing code
   * - 2. isURL regexp definition
   * - 3. isURL used in tandedm with 'url' editingType
   * - 4. disable tab in edit mode
   * @param key
   */
  onEditPress(key: Key) {
    this.editingType = this.columns
      .get(this.horizontalPointer)
      .editable.toLowerCase()
    this.isNumber = /^[0-9]$/.test(key.name!)
    this.isText = /^[a-zA-Z0-9\s]$/.test(key.sequence!)
    this.isDecimal = /^[0-9\,\.]$/.test(key.sequence!)

    // 2. Introduced Yaku specific regexp test, in order to allow special characters
    this.isURL =
      /^[a-zA-Z0-9\~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\[\{\]\}\\\|\;\:\'\"\,\<\.\>\/\?\s]$/.test(
        key.sequence!
      )

    let value = this.rows.choices[this.pointer][this.horizontalPointer]

    if (this.firstTimeEditingMode) {
      this.valueBeforeEditing = value
      this.firstTimeEditingMode = false
      value = ''
    }

    switch (key.name!) {
      case 'tab': {
        // disable tab in edit mode
        return false
      }
      case 'escape': {
        this.rows.choices[this.pointer][this.horizontalPointer] =
          this.valueBeforeEditing
        this.render()
        return this.updateEditing()
      }
      case 'delete': {
        this.rows.choices[this.pointer][this.horizontalPointer] = ''
        this.formatCell()
        return this.updateEditing()
      }
      case 'backspace': {
        let value =
          this.rows.choices[this.pointer][this.horizontalPointer].toString()
        this.rows.choices[this.pointer][this.horizontalPointer] = value.slice(
          0,
          -1
        )
        value =
          this.rows.choices[this.pointer][this.horizontalPointer].toString()
        if (value.length === 0) {
          this.formatCell()
          this.updateEditing()
        }
        this.render()
      }
      default: {
        if (this.isNumber && this.editingType === 'number') {
          this.rows.choices[this.pointer][this.horizontalPointer] =
            value + key.name
          this.render()
        }
        // 3. Taken into account Yaku specific editingType "url"
        if (
          (this.isText && this.editingType === 'text') ||
          (this.isURL && this.editingType === 'url')
        ) {
          this.rows.choices[this.pointer][this.horizontalPointer] =
            value + key.sequence
          this.render()
        }
        if (this.isDecimal && this.editingType === 'decimal') {
          const existDecimalPoint =
            value.indexOf('.') >= 0 || value.indexOf(',') >= 0
          const decimalPointPressed =
            key.sequence!.indexOf('.') >= 0 || key.sequence!.indexOf(',') >= 0
          const keyAccepted =
            !decimalPointPressed || (!existDecimalPoint && decimalPointPressed)
          if (keyAccepted) {
            this.rows.choices[this.pointer][this.horizontalPointer] =
              value +
              key
                .sequence!.replace('.', this.opt.decimalPoint)
                .replace(',', this.opt.decimalPoint)
            this.render()
          }
        }
        return false
      }
    }
  }
}
