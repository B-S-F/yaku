// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import {
  KeypressEvent,
  Status,
  createPrompt,
  makeTheme,
  useKeypress,
  usePrefix,
  useState,
} from '@inquirer/core'
import { type InquirerReadline } from '@inquirer/type'
import chalk from 'chalk'
import Table from 'cli-table3'
import ansiEscapes from 'ansi-escapes'
import { TableColumn, TableConfig, TableStyle } from '../yaku-prompts'

type TableState = {
  mode: {
    inEdit: boolean
    inFilter: boolean
    showNavigationHelp: boolean
  }
  selection: {
    selectedRow: number
    selectedColumn: number
    firstVisibleRow: number
    lastVisibleRow: number
    pageSize: number
  }
  cellInput: {
    isValid: boolean
    newValue: string
    cursorPosition: number
  }
  filterInput: {
    filterValue: string
    filterPreviousValue: string
  }
  sortInput: {
    sortedColumn: number
    sortedAsc: boolean
  }
  rows: (string | number | boolean)[][]
}

interface KeypressEventExt extends KeypressEvent {
  shift: boolean
}

enum KEY {
  ENTER = 'enter',
  RETURN = 'return',
  ESCAPE = 'escape',
  SPACE = 'space',
  BACKSPACE = 'backspace',
  TAB = 'tab',
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  INSERT = 'insert',
  DELETE = 'delete',
  HOME = 'home',
  END = 'end',
  PAGEUP = 'pageup',
  PAGEDOWN = 'pagedown',
  h = 'h',
  H = 'H',
  f = 'f',
  F = 'F',
}

const EMPTY_TEXT_PLACEHOLDER = ' '
const DEFAULT_PAGE_SIZE = 5
const WARNING_UNSAVED_CHANGES =
  'You have unsaved changes changes. Press <Enter> and confirm to save them'
const INFO_CANNOT_EDIT_USING_SPACE =
  'Use <Insert> or <Delete> to edit this cell'
const INFO_CANNOT_EDIT_USING_INSERT_OR_DELETE =
  'Use <Space> in order to set as current'
const INFO_CANNOT_EDIT_READONLY_VALUE = 'This value cannot be edited'
const INFO_VALIDATION_ERRORS_PRESENT = 'The inserted value is not valid'
const INFO_COLUMN_NOT_SORTABLE = 'Cannot sort by the selected column'
const INFO_NO_RESULTS_FOUND = 'No results found, please change the filter'
const EDITABLE_PATTERNS = {
  number: /^[0-9\-]$/,
  text: /^[a-zA-Z0-9\-]$/,
  decimal: /^[0-9\.\-]$/,
  url: /^[a-zA-Z0-9\~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\[\{\]\}\\\|\;\:\'\"\,\<\.\>\/\?]$/,
}

const VALIDATION_FUNCTIONS = {
  number: (value: string): boolean =>
    value === '' || String(Number(value)) === value,
  text: (value: string): boolean => true,
  decimal: (value: string): boolean =>
    value === '' || String(Number(value)) === value,
  url: (value: string): boolean => {
    try {
      return String(new URL(value)) === value
    } catch (err) {
      return false
    }
  },
}

function calculatePageSize(config: TableConfig) {
  if (!config.pageSize) {
    return DEFAULT_PAGE_SIZE
  } else if (config.rows.length < config.pageSize) {
    return config.rows.length
  } else {
    return config.pageSize
  }
}

function isSelectionEditable(config: TableConfig, state: TableState) {
  return (
    config.columns[state.selection.selectedColumn].editable &&
    config.columns[state.selection.selectedColumn].editable !== 'radio' &&
    config.columns[state.selection.selectedColumn].editable !== 'checkbox'
  )
}

function isSelectionRadio(config: TableConfig, state: TableState) {
  return (
    config.columns[state.selection.selectedColumn].editable &&
    config.columns[state.selection.selectedColumn].editable === 'radio'
  )
}

function isSelectionCheckbox(config: TableConfig, state: TableState) {
  return (
    config.columns[state.selection.selectedColumn].editable &&
    config.columns[state.selection.selectedColumn].editable === 'checkbox'
  )
}

function renderTable(
  columns: TableColumn[],
  state: TableState,
  style?: TableStyle,
) {
  if (!style) {
    style = {
      radioOff: '○',
      radioOn: '●',
      checkboxOff: '□',
      checkboxOn: '■',
      scrollHead: '↕',
      scrollSingle: '↕',
      scrollUp: '↑',
      scrollDown: '↓',
      emptyValue: '|',
      sortedAsc: '▲',
      sortedDesc: '▼',
      valueTextValid: chalk.blue,
      valueBgValid: chalk.bgBlue,
      valueTextInvalid: chalk.red,
      valueBgInvalid: chalk.bgRed,
    }
  }
  // handle the table head
  const head: string[] = []
  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    let displayValue = chalk.cyan.bold(columns[colIdx].name)
    if (
      columns[colIdx].editable !== 'radio' &&
      columns[colIdx].editable !== 'checkbox'
    ) {
      displayValue += EMPTY_TEXT_PLACEHOLDER
      if (colIdx === state.sortInput.sortedColumn) {
        displayValue += state.sortInput.sortedAsc
          ? chalk.yellow(style.sortedAsc)
          : chalk.yellow(style.sortedDesc)
      } else {
        displayValue += EMPTY_TEXT_PLACEHOLDER
      }
    }
    head.push(displayValue)
  }
  let isPaginated = false
  if (
    state.selection.firstVisibleRow > 0 ||
    state.selection.lastVisibleRow < state.rows.length - 1
  ) {
    isPaginated = true
    head.push(chalk.cyan(style.scrollHead))
  }
  const table = new Table({ head: head })

  // we use state to limit the view, from firstVisibleRow to lastVisibleRow (including)
  for (
    let row = state.selection.firstVisibleRow;
    row <= state.selection.lastVisibleRow;
    row++
  ) {
    const renderedRow: any[] = []

    for (let column = 0; column < columns.length; column++) {
      const cellValue = state.rows[row][column + 1] // account for the index at the beginning
      const isSelected =
        row === state.selection.selectedRow &&
        column === state.selection.selectedColumn
      const isEditable = columns[column].editable
      const isRadio = isEditable === 'radio'
      const isCheckbox = isEditable === 'checkbox'

      if (isSelected) {
        // provide highlight for the selection
        if (state.mode.inEdit) {
          // background for the pointer
          const valueBeforeCursor = state.cellInput.newValue.substring(
            0,
            state.cellInput.cursorPosition,
          )
          const valueOnCursor = state.cellInput.newValue.substring(
            state.cellInput.cursorPosition,
            state.cellInput.cursorPosition + 1,
          )
          const valueAfterCursor = state.cellInput.newValue.substring(
            state.cellInput.cursorPosition + 1,
          )
          let styledNewValue
          if (state.cellInput.isValid) {
            styledNewValue =
              style.valueTextValid(valueBeforeCursor) +
              style.valueBgValid(valueOnCursor) +
              style.valueTextValid(valueAfterCursor)
          } else {
            styledNewValue =
              style.valueTextInvalid(valueBeforeCursor) +
              style.valueBgInvalid(valueOnCursor) +
              style.valueTextInvalid(valueAfterCursor)
          }
          if (
            state.cellInput.cursorPosition == state.cellInput.newValue.length
          ) {
            if (state.cellInput.isValid) {
              styledNewValue += style.valueBgValid(EMPTY_TEXT_PLACEHOLDER)
            } else {
              styledNewValue += style.valueBgInvalid(EMPTY_TEXT_PLACEHOLDER)
            }
          } else {
            styledNewValue += EMPTY_TEXT_PLACEHOLDER
          }
          renderedRow.push(styledNewValue)
        } else {
          // Set the value based on the type and state of column
          let displayValue = style.emptyValue
          if (isRadio) {
            displayValue = cellValue ? style.radioOn : style.radioOff
          } else if (isCheckbox) {
            displayValue = cellValue ? style.checkboxOn : style.checkboxOff
          } else if (cellValue) {
            displayValue = String(cellValue)
          }
          if (isEditable) {
            // green highlight for editable
            renderedRow.push(chalk.green(displayValue))
          } else {
            // red highlight for read only
            renderedRow.push(chalk.red(displayValue))
          }
        }
      } else if (isEditable) {
        // default (white) color for editable
        if (isRadio) {
          renderedRow.push(cellValue ? style.radioOn : style.radioOff)
        } else if (isCheckbox) {
          renderedRow.push(cellValue ? style.checkboxOn : style.checkboxOff)
        } else {
          renderedRow.push(cellValue)
        }
      } else {
        // gray for read only
        renderedRow.push(chalk.gray(cellValue))
      }
    }

    // add pagination markers
    if (isPaginated) {
      if (state.selection.firstVisibleRow === state.selection.lastVisibleRow) {
        renderedRow.push(style.scrollSingle)
      } else if (
        state.selection.firstVisibleRow > 0 &&
        row === state.selection.firstVisibleRow
      ) {
        renderedRow.push(style.scrollUp)
      } else if (state.selection.firstVisibleRow === 0 && row === 0) {
        renderedRow.push(chalk.gray(style.scrollUp))
      } else if (
        state.selection.lastVisibleRow < state.rows.length - 1 &&
        row === state.selection.lastVisibleRow
      ) {
        renderedRow.push(style.scrollDown)
      } else if (
        state.selection.lastVisibleRow === state.rows.length - 1 &&
        row === state.rows.length - 1
      ) {
        renderedRow.push(chalk.gray(style.scrollDown))
      }
    }
    table.push(renderedRow)
  }
  return table
}

function adjustStateAfterRowChange(state: TableState): void {
  if (state.selection.selectedRow < state.selection.firstVisibleRow) {
    // must shift up
    state.selection.firstVisibleRow = state.selection.selectedRow
    state.selection.lastVisibleRow =
      Number(state.selection.selectedRow) + Number(state.selection.pageSize) - 1
  } else if (state.selection.selectedRow > state.selection.lastVisibleRow) {
    // must shift down
    state.selection.lastVisibleRow = state.selection.selectedRow
    state.selection.firstVisibleRow =
      Number(state.selection.selectedRow) - Number(state.selection.pageSize) + 1
  }
}

function adjustStateAfterPageChange(state: TableState) {
  if (
    Number(state.selection.selectedRow) + Number(state.selection.pageSize) <
    state.rows.length
  ) {
    // selection as the first visible row
    state.selection.firstVisibleRow = state.selection.selectedRow
    state.selection.lastVisibleRow =
      Number(state.selection.firstVisibleRow) +
      Number(state.selection.pageSize) -
      1
  } else {
    // selection somewhere in the middle (last page)
    state.selection.lastVisibleRow = state.rows.length - 1
    state.selection.firstVisibleRow =
      Number(state.selection.lastVisibleRow) -
      Number(state.selection.pageSize) +
      1
  }
}

function enterEditMode(
  config: TableConfig,
  state: TableState,
  setInfo: (infoMsg: string) => void,
  setState: (internalState: TableState) => void,
  clearExistingValue: boolean,
) {
  if (isSelectionRadio(config, state) || isSelectionCheckbox(config, state)) {
    // avoid confusion with radio selection
    setInfo(INFO_CANNOT_EDIT_USING_INSERT_OR_DELETE)
  } else if (!isSelectionEditable(config, state)) {
    // cannot enter edit mode for disabled columns
    setInfo(INFO_CANNOT_EDIT_READONLY_VALUE)
  } else {
    // enter edit mode
    const rowIndex = Number(state.rows[state.selection.selectedRow][0])
    state.mode.inEdit = true
    state.cellInput.newValue = clearExistingValue
      ? ''
      : config.rows[rowIndex][state.selection.selectedColumn].toString()
    state.cellInput.cursorPosition = state.cellInput.newValue.length
    state.cellInput.isValid = isValid(state, config)
    setState(state)
  }
}

function resetStates(
  setError: (errorMsg: string | undefined) => void,
  setInfo: (infoMsg: string | undefined) => void,
  setConfirmWithSave: (confirmWithSaveMsg: string | undefined) => void,
  setConfirmWithoutSave: (confirmWithoutSaveMsg: string | undefined) => void,
) {
  setError(undefined)
  setInfo(undefined)
  setConfirmWithSave(undefined)
  setConfirmWithoutSave(undefined)
}

function isValid(state: TableState, config: TableConfig) {
  const editableType = config.columns[state.selection.selectedColumn].editable
  if (editableType && editableType !== 'radio' && editableType !== 'checkbox') {
    let validationFunction: (value: string) => boolean =
      VALIDATION_FUNCTIONS[editableType]
    const customValidationFunction =
      config.columns[state.selection.selectedColumn].customValidation
    if (customValidationFunction !== undefined) {
      validationFunction = customValidationFunction
    }
    return validationFunction(state.cellInput.newValue)
  }
  return true
}

function handleFilterKeypress(
  event: KeypressEvent,
  rl: InquirerReadline,
  setState: (internalState: TableState) => void,
  state: TableState,
  config: TableConfig,
) {
  // handle keypress during edit in the fiter prompt
  switch (event.name) {
    case KEY.ENTER: // use fall-through
    case KEY.RETURN: {
      if (state.rows.length > 0) {
        state.filterInput.filterPreviousValue = state.filterInput.filterValue
        state.mode.inFilter = false
        setState(state)
      }
      break
    }
    case KEY.ESCAPE: {
      state.mode.inFilter = false
      state.filterInput.filterValue = state.filterInput.filterPreviousValue
        ? state.filterInput.filterPreviousValue
        : ''
      filterTableData(config, state)
      setState(state)
      break
    }
    case KEY.BACKSPACE: {
      // backspace removes the last character
      if (state.filterInput.filterValue.length <= 1) {
        state.filterInput.filterValue = ''
      } else {
        state.filterInput.filterValue = state.filterInput.filterValue.substring(
          0,
          state.filterInput.filterValue.length - 1,
        )
      }
      filterTableData(config, state)
      setState(state)
      break
    }
    case KEY.DELETE: {
      // delete removes all characters
      state.filterInput.filterValue = ''
      filterTableData(config, state)
      setState(state)
      break
    }
    default: {
      state.filterInput.filterValue += rl.line.slice(-1) // last char
      filterTableData(config, state)
      setState(state)
      break
    }
  }
}

function handleEditKeypress(
  event: KeypressEvent,
  rl: InquirerReadline,
  setState: (internalState: TableState) => void,
  setWarning: (warningMsg: string) => void,
  setInfo: (infoMsg: string) => void,
  state: TableState,
  config: TableConfig,
) {
  // handle keypress during edit in one of the cells
  switch (event.name) {
    case KEY.ENTER: // use fall-through
    case KEY.RETURN: {
      // enter sets the newly entered value (if changed and valid)
      const isFieldValid = isValid(state, config)
      // rowIndex refers to the original index (before being altered by sorting/filtering)
      const rowIndex = Number(state.rows[state.selection.selectedRow][0])
      const isFieldModified =
        config.rows[rowIndex][state.selection.selectedColumn] !==
        state.cellInput.newValue
      if (isFieldValid && isFieldModified) {
        // update the value in the provided rows (at the original index)
        config.rows[rowIndex][state.selection.selectedColumn] =
          state.cellInput.newValue
        // update the value in the virtual rows (at the selected index)
        state.rows[state.selection.selectedRow][
          state.selection.selectedColumn + 1
        ] = state.cellInput.newValue

        setWarning(WARNING_UNSAVED_CHANGES)
        state.mode.inEdit = false
        state.cellInput.isValid = true
        state.cellInput.newValue = ''

        // reset table after the value has been saved
        resetSortAndFilter(state, config, rowIndex)
      } else if (!isFieldValid) {
        state.cellInput.isValid = false
        setInfo(INFO_VALIDATION_ERRORS_PRESENT)
      } else {
        state.mode.inEdit = false
        state.cellInput.newValue = ''
      }
      setState(state)
      break
    }
    case KEY.ESCAPE: {
      // escape discards the new value
      state.mode.inEdit = false
      state.cellInput.newValue = ''
      setState(state)
      break
    }
    case KEY.BACKSPACE: {
      // backspace removes the last character
      if (state.cellInput.newValue.length <= 1) {
        state.cellInput.newValue = ''
      } else {
        const valueBeforeCursor = state.cellInput.newValue.substring(
          0,
          state.cellInput.cursorPosition - 1,
        )
        const valueAfterCursor = state.cellInput.newValue.substring(
          state.cellInput.cursorPosition,
        )
        state.cellInput.newValue = valueBeforeCursor + valueAfterCursor
      }
      if (state.cellInput.cursorPosition > 0) {
        state.cellInput.cursorPosition -= 1
      }
      state.cellInput.isValid = isValid(state, config)
      setState(state)
      break
    }
    case KEY.DELETE: {
      // delete removes all characters
      state.cellInput.newValue = ''
      state.cellInput.cursorPosition = 0
      state.cellInput.isValid = isValid(state, config)
      setState(state)
      break
    }
    case KEY.LEFT: {
      // move cursor to the left
      if (state.cellInput.cursorPosition > 0) {
        state.cellInput.cursorPosition -= 1
        setState(state)
      }
      break
    }
    case KEY.RIGHT: {
      // move cursor to the left
      if (state.cellInput.cursorPosition < state.cellInput.newValue.length) {
        state.cellInput.cursorPosition += 1
        setState(state)
      }
      break
    }
    default: {
      const editableType =
        config.columns[state.selection.selectedColumn].editable
      if (
        editableType &&
        editableType !== 'radio' &&
        editableType !== 'checkbox'
      ) {
        const sequence = rl.line.slice(-1) // last char
        if (EDITABLE_PATTERNS[editableType]?.test(sequence)) {
          const valueBeforeCursor = state.cellInput.newValue.substring(
            0,
            state.cellInput.cursorPosition,
          )
          const valueAfterCursor = state.cellInput.newValue.substring(
            state.cellInput.cursorPosition,
          )
          state.cellInput.newValue =
            valueBeforeCursor + sequence + valueAfterCursor
          state.cellInput.cursorPosition += 1
          state.cellInput.isValid = isValid(state, config)
        }
        setState(state)
      }
      break
    }
  }
}

function handleNavigationKeypress(
  event: KeypressEventExt,
  done: (promptResult: any) => void,
  setStatus: (promptStatus: string) => void,
  setState: (internalState: TableState) => void,
  setWarning: (warningMsg: string) => void,
  setInfo: (infoMsg: string) => void,
  setConfirmWithSave: (confirmWithSaveMsg: string | undefined) => void,
  setConfirmWithoutSave: (confirmWithoutSaveMsg: string | undefined) => void,
  state: TableState,
  hasConfirmWithSaveMsg: boolean,
  hasConfirmWithoutSaveMsg: boolean,
  config: TableConfig,
) {
  switch (event.name) {
    case KEY.SPACE: {
      if (
        !isSelectionRadio(config, state) &&
        !isSelectionCheckbox(config, state)
      ) {
        // cannot select current environment from another cell
        if (isSelectionEditable(config, state)) {
          setInfo(INFO_CANNOT_EDIT_USING_SPACE)
        } else {
          setInfo(INFO_CANNOT_EDIT_READONLY_VALUE)
        }
      } else {
        const rowIndex = Number(state.rows[state.selection.selectedRow][0])
        if (
          isSelectionRadio(config, state) &&
          !state.rows[state.selection.selectedRow][
            state.selection.selectedColumn + 1
          ]
        ) {
          // space selects the current environment
          for (let row = 0; row < config.rows.length; row++) {
            // cleanup previous current environment
            config.rows[row][state.selection.selectedColumn] = false
          }
          for (let row = 0; row < state.rows.length; row++) {
            // cleanup previous current environment
            state.rows[row][state.selection.selectedColumn + 1] = false
          }
          config.rows[rowIndex][state.selection.selectedColumn] = true
          state.rows[state.selection.selectedRow][
            state.selection.selectedColumn + 1
          ] = true
          setWarning(WARNING_UNSAVED_CHANGES)
        } else if (isSelectionCheckbox(config, state)) {
          // flip value for checkbox
          config.rows[rowIndex][state.selection.selectedColumn] =
            !config.rows[rowIndex][state.selection.selectedColumn]
          state.rows[state.selection.selectedRow][
            state.selection.selectedColumn + 1
          ] =
            !state.rows[state.selection.selectedRow][
              state.selection.selectedColumn + 1
            ]
          setWarning(WARNING_UNSAVED_CHANGES)
        }
      }
      break
    }
    case KEY.INSERT: {
      enterEditMode(config, state, setInfo, setState, false)
      break
    }
    case KEY.DELETE: {
      enterEditMode(config, state, setInfo, setState, true)
      break
    }
    case KEY.ENTER: // use fall-though
    case KEY.RETURN: {
      // double-enter saves the changes
      if (!hasConfirmWithSaveMsg) {
        setConfirmWithSave('Press ENTER again to confirm (save changes)!')
      } else {
        setStatus('done')
        setWarning('')
        done(config.rows)
      }
      break
    }
    case KEY.ESCAPE: {
      // double escape discards the changes
      if (!hasConfirmWithoutSaveMsg) {
        setConfirmWithoutSave('Press ESC again to exit (discard changes)!')
      } else {
        setStatus('done')
        setWarning('')
        done(undefined)
      }
      break
    }
    case KEY.RIGHT: {
      if (state.selection.selectedColumn < config.columns.length - 1) {
        state.selection.selectedColumn++
      } else {
        state.selection.selectedColumn = 0
      }
      setState(state)
      break
    }
    case KEY.LEFT: {
      if (state.selection.selectedColumn > 0) {
        state.selection.selectedColumn--
      } else {
        state.selection.selectedColumn = config.columns.length - 1
      }
      setState(state)
      break
    }
    case KEY.UP: {
      if (
        event.shift &&
        config.columns[state.selection.selectedColumn].sortable
      ) {
        if (
          state.sortInput.sortedColumn == state.selection.selectedColumn &&
          state.sortInput.sortedAsc
        ) {
          state.sortInput.sortedColumn = -1
          state.sortInput.sortedAsc = false
        } else {
          state.sortInput.sortedColumn = state.selection.selectedColumn
          state.sortInput.sortedAsc = true
        }
        sortTableData(config, state)
        setState(state)
      } else if (!event.shift) {
        if (state.selection.selectedRow > 0) {
          state.selection.selectedRow--
        } else {
          state.selection.selectedRow = state.rows.length - 1
        }
        adjustStateAfterRowChange(state)
        setState(state)
      } else {
        setInfo(INFO_COLUMN_NOT_SORTABLE)
      }
      break
    }
    case KEY.DOWN: {
      if (
        event.shift &&
        config.columns[state.selection.selectedColumn].sortable
      ) {
        if (
          state.sortInput.sortedColumn == state.selection.selectedColumn &&
          !state.sortInput.sortedAsc
        ) {
          state.sortInput.sortedColumn = -1
        } else {
          state.sortInput.sortedColumn = state.selection.selectedColumn
          state.sortInput.sortedAsc = false
        }
        sortTableData(config, state)
        setState(state)
      } else if (!event.shift) {
        if (state.selection.selectedRow < state.rows.length - 1) {
          state.selection.selectedRow++
        } else {
          state.selection.selectedRow = 0
        }
        adjustStateAfterRowChange(state)
        setState(state)
      } else {
        setInfo(INFO_COLUMN_NOT_SORTABLE)
      }
      break
    }
    case KEY.TAB: {
      if (event.shift) {
        // back tab
        if (state.selection.selectedColumn > 0) {
          state.selection.selectedColumn--
        } else {
          state.selection.selectedColumn = config.columns.length - 1
          if (state.selection.selectedRow > 0) {
            state.selection.selectedRow--
          } else {
            state.selection.selectedRow = state.rows.length - 1
          }
        }
      } else {
        // normal tab
        if (state.selection.selectedColumn < config.columns.length - 1) {
          state.selection.selectedColumn++
        } else {
          state.selection.selectedColumn = 0
          if (state.selection.selectedRow < state.rows.length - 1) {
            state.selection.selectedRow++
          } else {
            state.selection.selectedRow = 0
          }
        }
      }
      adjustStateAfterRowChange(state)
      setState(state)
      break
    }
    case KEY.PAGEUP: {
      const currentPage = Math.floor(
        state.selection.selectedRow / state.selection.pageSize,
      )
      const nextSelection = (currentPage - 1) * state.selection.pageSize
      state.selection.selectedRow =
        nextSelection >= 0
          ? nextSelection
          : Math.floor((state.rows.length - 1) / state.selection.pageSize) *
            state.selection.pageSize
      adjustStateAfterPageChange(state)
      setState(state)
      break
    }
    case KEY.PAGEDOWN: {
      const currentPage = Math.floor(
        state.selection.selectedRow / state.selection.pageSize,
      )
      const nextSelection = (Number(currentPage) + 1) * state.selection.pageSize
      state.selection.selectedRow =
        nextSelection < state.rows.length ? nextSelection : 0
      adjustStateAfterPageChange(state)
      setState(state)
      break
    }
    case KEY.HOME: {
      state.selection.selectedRow = 0
      state.selection.firstVisibleRow = 0
      state.selection.lastVisibleRow = state.selection.pageSize - 1
      setState(state)
      break
    }
    case KEY.END: {
      state.selection.selectedRow = state.rows.length - 1
      state.selection.firstVisibleRow =
        state.rows.length - state.selection.pageSize
      state.selection.lastVisibleRow = state.rows.length - 1
      setState(state)
      break
    }
    case KEY.f: // use fall-though
    case KEY.F: {
      if (event.shift) {
        state.mode.inFilter = true
        // reset sorting
        state.sortInput.sortedColumn = -1
        state.sortInput.sortedAsc = false
        sortTableData(config, state)
        //reset row selection
        state.selection.selectedRow = 0
        adjustStateAfterRowChange(state)
        setState(state)
      }
      break
    }
    default: {
      break
    }
  }
}

function handleKeypress(
  event: KeypressEventExt,
  rl: InquirerReadline,
  done: (promptResult: any) => void,
  setStatus: (promptStatus: string) => void,
  setState: (internalState: TableState) => void,
  setError: (errorMsg: string | undefined) => void,
  setWarning: (warningMsg: string) => void,
  setInfo: (infoMsg: string | undefined) => void,
  setConfirmWithSave: (confirmWithSaveMsg: string | undefined) => void,
  setConfirmWithoutSave: (confirmWithoutSaveMsg: string | undefined) => void,
  state: TableState,
  hasConfirmWithSaveMsg: boolean,
  hasConfirmWithoutSaveMsg: boolean,
  config: TableConfig,
) {
  // reset states from previous keypress
  resetStates(setError, setInfo, setConfirmWithSave, setConfirmWithoutSave)

  if (state.mode.inFilter) {
    handleFilterKeypress(event, rl, setState, state, config)
  } else if (state.mode.inEdit) {
    handleEditKeypress(event, rl, setState, setWarning, setInfo, state, config)
  } else if (KEY.h === event.name || KEY.H === event.name) {
    state.mode.showNavigationHelp = !state.mode.showNavigationHelp
    setState(state)
  } else if (!state.mode.showNavigationHelp) {
    handleNavigationKeypress(
      event,
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      state,
      hasConfirmWithSaveMsg,
      hasConfirmWithoutSaveMsg,
      config,
    )
  }
  rl.clearLine(0)
  // must be set explicitly
  setError('')
  // this fixes the performance issue (lag)
  rl.setMaxListeners(0)
}

function sortTableData(config: TableConfig, state: TableState) {
  if (state.sortInput.sortedColumn == -1) {
    filterTableData(config, state)
  } else {
    state.rows.sort(
      (a: (string | number | boolean)[], b: (string | number | boolean)[]) => {
        if (
          config.columns[state.sortInput.sortedColumn].editable === 'number' ||
          config.columns[state.sortInput.sortedColumn].editable === 'decimal'
        ) {
          // sort as number
          const aNr = Number(a[state.sortInput.sortedColumn + 1])
          const bNr = Number(b[state.sortInput.sortedColumn + 1])
          return state.sortInput.sortedAsc ? aNr - bNr : bNr - aNr
        } else {
          // sort as string
          const aBuff = Buffer.from(String(a[state.sortInput.sortedColumn + 1]))
          const bBuff = Buffer.from(String(b[state.sortInput.sortedColumn + 1]))
          return state.sortInput.sortedAsc
            ? Buffer.compare(aBuff, bBuff)
            : Buffer.compare(bBuff, aBuff)
        }
      },
    )
  }
}

function filterTableData(config: TableConfig, state: TableState) {
  //reset
  state.rows = config.rows.map((row, idx) => [idx, ...row])

  if (state.filterInput.filterValue) {
    //filter
    state.rows = state.rows.filter((row) => {
      let result = false
      for (let idx = 0; idx < config.columns.length; idx++) {
        if (
          config.columns[idx].filterable &&
          String(row[idx + 1]).indexOf(state.filterInput.filterValue) > -1
        ) {
          result = true
        }
      }
      return result
    })
  }
  state.selection = {
    ...state.selection,
    pageSize:
      state.rows.length < Number(config.pageSize)
        ? state.rows.length
        : Number(config.pageSize),
    selectedRow: 0,
    firstVisibleRow: 0,
    lastVisibleRow:
      state.rows.length <= Number(config.pageSize)
        ? state.rows.length - 1
        : Number(config.pageSize) - 1,
  }
}

function resetSortAndFilter(
  state: TableState,
  config: TableConfig,
  realRowIndex: number,
) {
  // deal with filtering and pagination effects
  if (state.filterInput.filterValue || state.sortInput.sortedColumn !== -1) {
    // reset filter
    state.filterInput.filterValue = ''
    state.filterInput.filterPreviousValue = ''
    state.sortInput.sortedColumn = -1
    state.sortInput.sortedAsc = false
    filterTableData(config, state)
    // reset sort
    sortTableData(config, state)
    // take the user to selection
    state.selection.selectedRow = realRowIndex
    adjustStateAfterRowChange(state)
  }
}

function generateHelpTip(state: TableState): string {
  if (state.mode.inFilter) {
    return `${chalk.yellow('Filter')} (Press ${chalk.cyan.bold(
      '<Enter>',
    )} to apply, ${chalk.cyan.bold('<Esc>')} to discard): ${chalk.yellow(
      state.filterInput.filterValue,
    )}`
  }
  if (state.mode.inEdit) {
    return `(Press ${chalk.cyan.bold(
      '<Enter>',
    )} to update the value, ${chalk.cyan.bold('<Esc>')} to cancel editing)`
  }
  let helpTip = `(Press ${chalk.cyan.bold(
    '<H>',
  )} to toggle navigation help, ${chalk.cyan.bold(
    '<Enter>',
  )} to save the changes and ${chalk.cyan.bold('<Esc>')} to discard)`

  if (state.mode.showNavigationHelp) {
    helpTip += `\n\nIn order to make changes, press ${chalk.cyan.bold(
      '<Space>',
    )} to set as current, ${chalk.cyan.bold('<Insert>')}/${chalk.cyan.bold(
      '<Delete>',
    )} to edit.\nUse ${chalk.cyan.bold('<Arrows>')} or ${chalk.cyan.bold(
      '<Tab>',
    )}/${chalk.cyan.bold(
      '<Shift + Tab>',
    )} to move between items.\nFor navigation between pages:\n - ${chalk.cyan.bold(
      '<PgUp>',
    )} goes to previous page, ${chalk.cyan.bold(
      '<PgDown>',
    )} to the next.\n - ${chalk.cyan.bold(
      '<Home>',
    )} takes you to the first page, ${chalk.cyan.bold(
      '<End>',
    )} to the last.\nSort the elements using ${chalk.cyan.bold(
      '<Shift + Up>',
    )}/${chalk.cyan.bold(
      '<Shift + Down>',
    )} or filter them using ${chalk.cyan.bold('<Shift + F>')}`
  }
  return helpTip
}

function generateUserMsg(
  errorMsg: string | unknown,
  confirmWithoutSaveMsg: string | unknown,
  confirmWithSaveMsg: string | unknown,
  infoMsg: string | unknown,
  warningMsg: string | unknown,
): string {
  if (errorMsg) {
    return chalk.red(errorMsg)
  } else if (confirmWithoutSaveMsg) {
    return chalk.red(confirmWithoutSaveMsg)
  } else if (confirmWithSaveMsg) {
    return chalk.green(confirmWithSaveMsg)
  } else if (infoMsg) {
    return chalk.magenta(infoMsg)
  } else if (warningMsg) {
    return chalk.yellow(warningMsg)
  }
  return ''
}

export default createPrompt((config: TableConfig, done) => {
  if (config.rows.length === 0) {
    throw Error('No environments available')
  }
  config.pageSize = calculatePageSize(config)

  const theme = makeTheme(undefined)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setError] = useState()
  const [warningMsg, setWarning] = useState()
  const [infoMsg, setInfo] = useState()
  const [confirmWithSaveMsg, setConfirmWithSave] = useState()
  const [confirmWithoutSaveMsg, setConfirmWithoutSave] = useState()
  const [state, setState] = useState({
    mode: {
      inEdit: false,
      inFilter: false,
      showNavigationHelp: false,
    },
    selection: {
      pageSize: config.pageSize,
      selectedRow: config.initWithSelectedRow ? config.initWithSelectedRow : 0,
      selectedColumn: 0,
      firstVisibleRow: 0,
      lastVisibleRow:
        config.rows.length <= config.pageSize
          ? config.rows.length - 1
          : config.pageSize - 1,
    },
    cellInput: {
      isValid: true,
      newValue: '',
      cursorPosition: 0,
    },
    filterInput: {
      filterValue: '',
      filterPreviousValue: '',
    },
    sortInput: {
      sortedColumn: -1,
      sortedAsc: true,
    },
    rows: config.rows.map((row, idx) => [idx, ...row]),
  } as TableState)
  const prefix = usePrefix({})

  if (config.initWithSelectedRow) {
    adjustStateAfterRowChange(state)
  }

  useKeypress(async (event: any, rl: InquirerReadline) => {
    handleKeypress(
      event,
      rl,
      done,
      setStatus,
      setState,
      setError,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      state,
      confirmWithSaveMsg !== undefined,
      confirmWithoutSaveMsg !== undefined,
      config,
    )
  })
  let message = theme.style.message(config.message, status as Status)
  if (!state.mode.inFilter && state.filterInput.filterValue) {
    message += `(${chalk.yellow(state.filterInput.filterValue)})`
  }
  let table: any = ''
  if (state.mode.inFilter && state.rows.length < 1) {
    table = chalk.red(INFO_NO_RESULTS_FOUND)
  } else if (!state.mode.showNavigationHelp) {
    table = renderTable(config.columns, state, config.style)
  }

  const helpTip = generateHelpTip(state)
  const userMsg = generateUserMsg(
    errorMsg,
    confirmWithoutSaveMsg,
    confirmWithSaveMsg,
    infoMsg,
    warningMsg,
  )

  return [
    [prefix, message, helpTip].filter(Boolean).join(EMPTY_TEXT_PLACEHOLDER),
    '',
    table.toString(),
    `${userMsg}`,
    `${ansiEscapes.eraseLine}${ansiEscapes.cursorHide}`,
  ].join('\n')
})

export let _t: any
if (process.env.NODE_ENV === 'test') {
  _t = {
    calculatePageSize,
    isSelectionEditable,
    isSelectionRadio,
    isSelectionCheckbox,
    renderTable,
    resetStates,
    adjustStateAfterRowChange,
    adjustStateAfterPageChange,
    enterEditMode,
    handleFilterKeypress,
    handleEditKeypress,
    handleNavigationKeypress,
    handleKeypress,
    sortTableData,
    filterTableData,
    resetSortAndFilter,
    generateHelpTip,
    generateUserMsg,
    isValid,
  }
}
