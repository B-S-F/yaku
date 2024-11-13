import { jest } from '@jest/globals'
import chalk from 'chalk'
import { TableColumn, TableConfig } from '../yaku-prompts'
import { _t } from './yaku-table-prompt'

// private functions to test
const {
  calculatePageSize,
  isSelectionEditable,
  isSelectionRadio,
  isSelectionCheckbox,
  renderTable,
  resetStates,
  adjustStateAfterRowChange,
  adjustStateAfterPageChange,
  handleFilterKeypress,
  handleEditKeypress,
  handleNavigationKeypress,
  enterEditMode,
  handleKeypress,
  sortTableData,
  filterTableData,
  resetSortAndFilter,
  generateHelpTip,
  generateUserMsg,
  isValid,
} = _t

const columns: TableColumn[] = [
  { name: '●', value: 'current', editable: 'radio' },
  {
    name: 'Name',
    value: 'name',
    editable: 'text',
    filterable: true,
    sortable: true,
  },
  {
    name: 'URL',
    value: 'url',
    editable: 'url',
    filterable: true,
    sortable: true,
  },
  {
    name: 'Namespace',
    value: 'namespace',
    editable: 'number',
    filterable: true,
    sortable: true,
  },
  { name: 'Access Token', value: 'accessToken' },
  { name: '■', value: 'checkbox', editable: 'checkbox' },
  { name: 'Expires At', value: 'expiresAt' },
]

const testRows = [
  [false, 'name1', 'http://url1.com/', 1, '***', true, '10/1/2024, 8:11:07 AM'],
  [true, 'name2', 'http://url2.com/', '', '***', true, '10/1/2024, 8:11:07 AM'],
  [false, 'name3', 'http://url3.com/', 3, '***', false, ''],
]

describe('calculatePageSize()', () => {
  const rows = [{}, {}, {}, {}, {}, {}]
  it('should return default page size', () => {
    const result = calculatePageSize({
      rows: rows,
    })
    expect(result).toBe(5)
  })
  it('should return provided page size', () => {
    const pageSize = 3
    const result = calculatePageSize({
      rows: rows,
      pageSize: pageSize,
    })
    expect(result).toBe(pageSize)
  })
  it('should return the rows length', () => {
    const result = calculatePageSize({
      rows: rows,
      pageSize: 10,
    })
    expect(result).toBe(rows.length)
  })
})

describe('isSelectionEditable()', () => {
  const config: TableConfig = {
    message: 'Environments',
    columns: columns,
    rows: [[true, 'name', 'url', 1, '***', '***', '10/1/2024, 8:11:07 AM']],
  }
  const state = {
    mode: {
      inEdit: false,
      inFilter: false,
      showNavigationHelp: false,
    },
    selection: {
      pageSize: 3,
      selectedRow: 0,
      selectedColumn: 0,
      firstVisibleRow: 0,
      lastVisibleRow: 1,
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
      sortedAsc: false,
    },
    rows: [],
  }
  it('current should not be editable', () => {
    expect(isSelectionEditable(config, state)).toBeFalsy()
  })
  it('name should be editable', () => {
    expect(
      isSelectionEditable(config, {
        ...state,
        selection: { ...state.selection, selectedColumn: 1 },
      })
    ).toBeTruthy()
  })
  it('url should be editable', () => {
    expect(
      isSelectionEditable(config, {
        ...state,
        selection: { ...state.selection, selectedColumn: 2 },
      })
    ).toBeTruthy()
  })
  it('namespace should be editable', () => {
    expect(
      isSelectionEditable(config, {
        ...state,
        selection: { ...state.selection, selectedColumn: 3 },
      })
    ).toBeTruthy()
  })
  it('accessToken should not be editable', () => {
    expect(
      isSelectionEditable(config, {
        ...state,
        selection: { ...state.selection, selectedColumn: 4 },
      })
    ).toBeFalsy()
  })
  it('refreshToken should not be editable', () => {
    expect(
      isSelectionEditable(config, {
        ...state,
        selection: { ...state.selection, selectedColumn: 5 },
      })
    ).toBeFalsy()
  })
  it('expiresAt should not be editable', () => {
    expect(
      isSelectionEditable(config, {
        ...state,
        selection: { ...state.selection, selectedColumn: 6 },
      })
    ).toBeFalsy()
  })
})

describe('isSelectionRadio()', () => {
  const config: TableConfig = {
    message: 'Environments',
    columns: columns,
    rows: [[true, 'name', 'url', 1, '***', true, '10/1/2024, 8:11:07 AM']],
  }
  const state = {
    mode: {
      inEdit: false,
      inFilter: false,
      showNavigationHelp: false,
    },
    selection: {
      pageSize: 3,
      selectedRow: 0,
      selectedColumn: 0,
      firstVisibleRow: 0,
      lastVisibleRow: 1,
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
      sortedAsc: false,
    },
    rows: [],
  }
  it('current should be radio', () => {
    expect(isSelectionRadio(config, state)).toBeTruthy()
  })
  it('all other columns should not be radio', () => {
    for (let i = 1; i < config.columns.length - 1; i++) {
      expect(
        isSelectionRadio(config, {
          ...state,
          selection: { ...state.selection, selectedColumn: i },
        })
      ).toBeFalsy()
    }
  })
})

describe('isSelectionCheckbox()', () => {
  const config: TableConfig = {
    message: 'Environments',
    columns: columns,
    rows: [[true, 'name', 'url', 1, '***', true, '10/1/2024, 8:11:07 AM']],
  }
  const state = {
    mode: {
      inEdit: false,
      inFilter: false,
      showNavigationHelp: false,
    },
    selection: {
      pageSize: 3,
      selectedRow: 0,
      selectedColumn: 5,
      firstVisibleRow: 0,
      lastVisibleRow: 1,
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
      sortedAsc: false,
    },
    rows: [],
  }
  it('current should be checkbox', () => {
    expect(isSelectionCheckbox(config, state)).toBeTruthy()
  })
  it('all other columns should not be checbox', () => {
    for (const i of [0, 1, 2, 3, 4, 6]) {
      expect(
        isSelectionCheckbox(config, {
          ...state,
          selection: { ...state.selection, selectedColumn: i },
        })
      ).toBeFalsy()
    }
  })
})

describe('renderTable()', () => {
  const state = {
    mode: {
      inEdit: false,
      inFilter: false,
      showNavigationHelp: false,
    },
    selection: {
      pageSize: 3,
      selectedRow: 0,
      selectedColumn: 0,
      firstVisibleRow: 0,
      lastVisibleRow: 2,
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
      sortedAsc: false,
    },
    rows: testRows.map((row, idx) => [idx, ...row]),
  }
  const rows = structuredClone(testRows)
  let expected: any[][]
  beforeEach(() => {
    expected = [
      [
        '○',
        rows[0][1],
        rows[0][2],
        rows[0][3],
        chalk.gray(rows[0][4]),
        '■',
        chalk.gray(rows[0][6]),
      ],
      [
        '●',
        rows[1][1],
        rows[1][2],
        rows[1][3],
        chalk.gray(rows[1][4]),
        '■',
        chalk.gray(rows[1][6]),
      ],
      [
        '○',
        rows[2][1],
        rows[2][2],
        rows[2][3],
        chalk.gray(rows[2][4]),
        '□',
        chalk.gray(rows[2][6]),
      ],
    ]
  })

  it('should render the table with green focus on radio', () => {
    expected[0][0] = chalk.green(expected[0][0])

    const result = renderTable(columns, state)

    expect(result).toStrictEqual(expected)
  })
  it('should render the table with green focus on editable cell', () => {
    expected[0][1] = chalk.green(expected[0][1])

    const result = renderTable(columns, {
      ...state,
      selection: { ...state.selection, selectedColumn: 1 },
    })

    expect(result).toStrictEqual(expected)
  })
  it('should render the table with green bar on editable cell for empty value', () => {
    expected[1][3] = chalk.green('|')

    const result = renderTable(columns, {
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 1,
        selectedColumn: 3,
      },
    })

    expect(result).toStrictEqual(expected)
  })
  it('should render the table with red bar on read-only cell for empty value', () => {
    expected[2][6] = chalk.red('|')

    const result = renderTable(columns, {
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 2,
        selectedColumn: 6,
      },
    })

    expect(result).toStrictEqual(expected)
  })
  it('should render the table with blue color and cursor when typing in editable cell (valid value)', () => {
    const newValue = 'new-value'
    expected[0][1] = chalk.blue(newValue) + chalk.bgBlue(' ')

    const result = renderTable(columns, {
      ...state,
      mode: {
        ...state.mode,
        inEdit: true,
      },
      selection: {
        ...state.selection,
        selectedColumn: 1,
      },
      cellInput: {
        ...state.cellInput,
        newValue: newValue,
        cursorPosition: newValue.length,
      },
    })

    expect(result).toStrictEqual(expected)
  })
  it('should render the table with red color and cursor when typing in editable cell (invalid value)', () => {
    const newValue = 'invalid--'
    expected[0][1] = chalk.red(newValue) + chalk.bgRed(' ')

    const result = renderTable(columns, {
      ...state,
      mode: {
        ...state.mode,
        inEdit: true,
      },
      selection: {
        ...state.selection,
        selectedColumn: 1,
      },
      cellInput: {
        ...state.cellInput,
        isValid: false,
        newValue: newValue,
        cursorPosition: newValue.length,
      },
    })

    expect(result).toStrictEqual(expected)
  })
  it('should render the table with red focus on read-only cell', () => {
    expected[0][6] = chalk.red(rows[0][6])

    const result = renderTable(columns, {
      ...state,
      selection: { ...state.selection, selectedColumn: 6 },
    })
    expect(result).toStrictEqual(expected)
  })
  it('should render the table with pagination and bottom scroll', () => {
    expected[0][0] = chalk.green(expected[0][0])
    expected[0].push(chalk.gray('↑'))
    expected[1].push('↓')
    expected.pop()

    const result = renderTable(columns, {
      ...state,
      selection: { ...state.selection, lastVisibleRow: 1 },
    })
    expect(result).toStrictEqual(expected)
  })
  it('should render the table with pagination and top scroll', () => {
    expected[1][0] = chalk.green(expected[1][0])
    expected[1].push('↑')
    expected[2].push(chalk.gray('↓'))

    const result = renderTable(columns, {
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 1,
        firstVisibleRow: 1,
      },
    })
    expect(result).toStrictEqual(expected.slice(1))
  })
  it('should render the table with pagination and double scroll (single row)', () => {
    expected[1][0] = chalk.green(expected[1][0])
    expected[1].push('↕')
    expected.pop()

    const result = renderTable(columns, {
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 1,
        firstVisibleRow: 1,
        lastVisibleRow: 1,
      },
    })
    expect(result).toStrictEqual(expected.slice(1))
  })
})

describe('resetStates()', () => {
  it('should call the hook functions', () => {
    const setError = jest.fn()
    const setInfo = jest.fn()
    const setConfirmWithSave = jest.fn()
    const setConfirmWithoutSave = jest.fn()

    resetStates(setError, setInfo, setConfirmWithSave, setConfirmWithoutSave)

    expect(setError).toHaveBeenCalledWith(undefined)
    expect(setInfo).toHaveBeenCalledWith(undefined)
    expect(setInfo).toHaveBeenCalledWith(undefined)
    expect(setInfo).toHaveBeenCalledWith(undefined)

    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
})

describe('adjustStateAfterRowChange()', () => {
  it.each([
    [0, 2, 1, 2, 0, 1],
    [2, 2, 0, 1, 1, 2],
    [0, 2, 0, 1, 0, 1],
  ])(
    "should adjust for selected row '%s' on a pageSize of %s from (%s, %s) to (%s, %s)",
    (
      selectedRow,
      pageSize,
      fromFirstVisibleRow,
      fromLastVisibleRow,
      toFirstVisibleRow,
      toLastVisibleRow
    ) => {
      const state = {
        mode: {
          inEdit: false,
          inFilter: false,
          showNavigationHelp: false,
        },
        selection: {
          pageSize: pageSize,
          selectedRow: selectedRow,
          selectedColumn: 0,
          firstVisibleRow: fromFirstVisibleRow,
          lastVisibleRow: fromLastVisibleRow,
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
          sortedAsc: false,
        },
        rows: testRows.map((row, idx) => [idx, ...row]),
      }
      adjustStateAfterRowChange(state)
      expect(state.selection.firstVisibleRow).toBe(toFirstVisibleRow)
      expect(state.selection.lastVisibleRow).toBe(toLastVisibleRow)
    }
  )
})

describe('adjustStateAfterPageChange()', () => {
  it.each([
    [0, 3, 10, 3, 5, 0, 2],
    [6, 3, 10, 3, 5, 6, 8],
    [9, 3, 10, 7, 9, 7, 9],
  ])(
    "should adjust for selected row '%s' on a pageSize of %s in %s items from (%s, %s) to (%s, %s)",
    (
      selectedRow,
      pageSize,
      numberOfRows,
      fromFirstVisibleRow,
      fromLastVisibleRow,
      toFirstVisibleRow,
      toLastVisibleRow
    ) => {
      const state = {
        mode: {
          inEdit: false,
          inFilter: false,
          showNavigationHelp: false,
        },
        selection: {
          pageSize: Number(pageSize),
          selectedRow: selectedRow,
          selectedColumn: 0,
          firstVisibleRow: fromFirstVisibleRow,
          lastVisibleRow: fromLastVisibleRow,
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
          sortedAsc: false,
        },
        rows: Array(10), // we only need the length for the tests
      }
      adjustStateAfterPageChange(state)
      expect(state.selection.firstVisibleRow).toBe(toFirstVisibleRow)
      expect(state.selection.lastVisibleRow).toBe(toLastVisibleRow)
    }
  )
})

describe('enterEditMode()', () => {
  let state: any
  let rows
  let config: any
  let setInfo: any
  let setState: any
  beforeEach(() => {
    setInfo = jest.fn()
    setState = jest.fn()
    state = {
      mode: {
        inEdit: false,
        inFilter: false,
        showNavigationHelp: false,
      },
      selection: {
        pageSize: 3,
        selectedRow: 0,
        selectedColumn: 0,
        firstVisibleRow: 0,
        lastVisibleRow: 2,
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
        sortedAsc: false,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }
    rows = structuredClone(testRows)
    config = {
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 3,
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
  it('should not enter edit mode on a radio column', () => {
    enterEditMode(config, state, setInfo, setState, true)

    expect(setState).not.toHaveBeenCalled()
    expect(setInfo).toHaveBeenCalledWith(
      'Use <Space> in order to set as current'
    )
  })
  it('should not enter edit mode on a read-only column', () => {
    enterEditMode(
      config,
      {
        ...state,
        selection: {
          ...state.selection,
          selectedColumn: 6,
        },
      },
      setInfo,
      setState,
      true
    )

    expect(setState).not.toHaveBeenCalled()
    expect(setInfo).toHaveBeenCalledWith('This value cannot be edited')
  })
  it('should enter edit mode and clear existing value', () => {
    enterEditMode(
      config,
      {
        ...state,
        selection: {
          ...state.selection,
          selectedColumn: 1,
        },
      },
      setInfo,
      setState,
      true
    )

    expect(setState).toHaveBeenCalledWith({
      ...state,
      mode: {
        ...state.mode,
        inEdit: true,
      },
      selection: {
        ...state.selection,
        selectedColumn: 1,
      },
    })
    expect(setInfo).not.toHaveBeenCalled()
  })
  it('should enter edit mode and without clearing the existing value', () => {
    const newValue = 'name1'

    enterEditMode(
      config,
      {
        ...state,
        selection: {
          ...state.selection,
          selectedColumn: 1,
        },
      },
      setInfo,
      setState,
      false
    )

    expect(setState).toHaveBeenCalledWith({
      ...state,
      mode: {
        ...state.mode,
        inEdit: true,
      },
      selection: {
        ...state.selection,
        selectedColumn: 1,
      },
      cellInput: {
        ...state.cellInput,
        newValue: newValue,
        cursorPosition: newValue.length,
      },
    })
    expect(setInfo).not.toHaveBeenCalled()
  })
})

describe('handleFilterKeypress()', () => {
  let state: any
  let rows
  let config: any
  let setStateSpy: any
  beforeEach(() => {
    setStateSpy = jest.fn()
    state = {
      mode: {
        inEdit: false,
        inFilter: true,
        showNavigationHelp: false,
      },
      selection: {
        pageSize: 1,
        selectedRow: 0,
        selectedColumn: 0,
        firstVisibleRow: 0,
        lastVisibleRow: 0,
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
        sortedAsc: false,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }
    rows = structuredClone(testRows)
    config = {
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 1,
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
  it('should save the changes to the filter (enter)', () => {
    state = {
      ...state,
      filterInput: {
        ...state.filterInput,
        filterValue: 'filterValue',
        filterPreviousValue: '',
      },
    }

    handleFilterKeypress({ name: 'enter' }, {}, setStateSpy, state, config)

    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      mode: { ...state.mode, inFilter: false },
      filterInput: {
        ...state.filterInput,
        filterValue: 'filterValue',
        filterPreviousValue: 'filterValue',
      },
    })
  })
  it('should discard the changes to the filter and reset it to empty (escape)', () => {
    state = {
      ...state,
      filterInput: {
        ...state.filterInput,
        filterValue: 'filterValue',
        filterPreviousValue: '',
      },
    }

    handleFilterKeypress({ name: 'escape' }, {}, setStateSpy, state, config)

    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      mode: { ...state.mode, inFilter: false },
      filterInput: {
        ...state.filterInput,
        filterValue: '',
        filterPreviousValue: '',
      },
    })
  })
  it('should discard the changes to the filter and reset filter to previous value (escape)', () => {
    state = {
      ...state,
      filterInput: {
        ...state.filterInput,
        filterValue: 'filterValue',
        filterPreviousValue: 'filterPreviousValue',
      },
    }

    handleFilterKeypress({ name: 'escape' }, {}, setStateSpy, state, config)

    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      mode: { ...state.mode, inFilter: false },
      filterInput: {
        ...state.filterInput,
        filterValue: 'filterPreviousValue',
        filterPreviousValue: 'filterPreviousValue',
      },
    })
  })
  it('should remove the last character of the filter sequence (backspace)', () => {
    state = {
      ...state,
      filterInput: {
        ...state.filterInput,
        filterValue: 'name',
        filterPreviousValue: '',
      },
    }

    handleFilterKeypress({ name: 'backspace' }, {}, setStateSpy, state, config)

    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      filterInput: {
        ...state.filterInput,
        filterValue: 'nam',
        filterPreviousValue: '',
      },
    })
  })
  it('should do nothing for an empty filter sequence (backspace)', () => {
    state = {
      ...state,
      filterInput: {
        ...state.filterInput,
        filterValue: '',
        filterPreviousValue: '',
      },
    }

    handleFilterKeypress({ name: 'backspace' }, {}, setStateSpy, state, config)

    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      filterInput: {
        ...state.filterInput,
        filterValue: '',
        filterPreviousValue: '',
      },
    })
  })
  it('should delete the filter sequence (delete)', () => {
    state = {
      ...state,
      filterInput: {
        ...state.filterInput,
        filterValue: 'filterValue',
        filterPreviousValue: '',
      },
    }

    handleFilterKeypress({ name: 'delete' }, {}, setStateSpy, state, config)

    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      filterInput: {
        ...state.filterInput,
        filterValue: '',
        filterPreviousValue: '',
      },
    })
  })
  it('should append the last character to the filter sequence', () => {
    const character = 'e'
    state = {
      ...state,
      filterInput: {
        ...state.filterInput,
        filterValue: 'nam',
        filterPreviousValue: '',
      },
    }

    handleFilterKeypress(
      { name: character },
      { line: character },
      setStateSpy,
      state,
      config
    )

    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      filterInput: {
        ...state.filterInput,
        filterValue: 'name',
        filterPreviousValue: '',
      },
    })
  })
})

describe('handleEditKeypress()', () => {
  let state: any
  let rows
  let config: any
  let setWarningSpy: any
  let setInfoSpy: any
  let setStateSpy: any
  beforeEach(() => {
    setWarningSpy = jest.fn()
    setInfoSpy = jest.fn()
    setStateSpy = jest.fn()
    state = {
      mode: {
        inEdit: true,
        inFilter: false,
        showNavigationHelp: false,
      },
      selection: {
        pageSize: 3,
        selectedRow: 0,
        selectedColumn: 0,
        firstVisibleRow: 0,
        lastVisibleRow: 2,
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
        sortedAsc: false,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }
    rows = structuredClone(testRows)
    config = {
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 3,
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
  it('should save the changes to the cell and present warning (enter)', () => {
    handleEditKeypress(
      { name: 'return' },
      {},
      setStateSpy,
      setWarningSpy,
      setInfoSpy,
      {
        ...state,
        selection: { ...state.selection, selectedColumn: 1 },
        cellInput: { ...state.cellInput, newValue: 'new-value' },
      },
      config
    )

    expect(config.rows[state.selection.selectedRow][1]).toBe('new-value')
    expect(state.rows[state.selection.selectedRow][2]).toBe('new-value')
    expect(setWarningSpy).toHaveBeenCalled()
    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      mode: { ...state.mode, inEdit: false },
      selection: { ...state.selection, selectedColumn: 1 },
      cellInput: { ...state.cellInput, newValue: '' },
    })
  })
  it('should not save the changes to the cell for invalid values and present info (enter)', () => {
    handleEditKeypress(
      { name: 'return' },
      {},
      setStateSpy,
      setWarningSpy,
      setInfoSpy,
      {
        ...state,
        selection: { ...state.selection, selectedColumn: 2 },
        cellInput: {
          ...state.cellInput,
          newValue: 'invalid-value--',
          isValid: false,
        },
      },
      config
    )

    expect(config.rows[state.selection.selectedRow][2]).toBe('http://url1.com/')
    expect(state.rows[state.selection.selectedRow][3]).toBe('http://url1.com/')
    expect(setWarningSpy).not.toHaveBeenCalled()
    expect(setInfoSpy).toHaveBeenCalledWith('The inserted value is not valid')
    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      mode: { ...state.mode, inEdit: true },
      selection: { ...state.selection, selectedColumn: 2 },
      cellInput: {
        ...state.cellInput,
        newValue: 'invalid-value--',
        isValid: false,
      },
    })
  })
  it('should not present warning when the new value is the same as the old value (enter)', () => {
    handleEditKeypress(
      { name: 'enter' },
      {},
      setStateSpy,
      setWarningSpy,
      setInfoSpy,
      {
        ...state,
        selection: { ...state.selection, selectedColumn: 1 },
        cellInput: {
          ...state.cellInput,
          newValue: 'name1',
        },
      },
      config
    )

    expect(config.rows[state.selection.selectedRow][1]).toBe('name1')
    expect(state.rows[state.selection.selectedRow][2]).toBe('name1')
    expect(setWarningSpy).not.toHaveBeenCalled()
    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      mode: { ...state.mode, inEdit: false },
      selection: { ...state.selection, selectedColumn: 1 },
      cellInput: {
        ...state.cellInput,
        newValue: '',
      },
    })
  })
  it('should not save the changes to the cell (escape)', () => {
    handleEditKeypress(
      { name: 'escape' },
      {},
      setStateSpy,
      setWarningSpy,
      setInfoSpy,
      {
        ...state,
        selection: { ...state.selection, selectedColumn: 1 },
        cellInput: {
          ...state.cellInput,
          newValue: 'name2',
        },
      },
      config
    )

    expect(config.rows[state.selection.selectedRow][1]).toBe('name1')
    expect(state.rows[state.selection.selectedRow][2]).toBe('name1')
    expect(setWarningSpy).not.toHaveBeenCalled()
    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      mode: { ...state.mode, inEdit: false },
      selection: { ...state.selection, selectedColumn: 1 },
      cellInput: {
        ...state.cellInput,
        newValue: '',
      },
    })
  })
  it('should remove the last character in a non-empty value (backspace)', () => {
    const newValue = 'name2'
    handleEditKeypress(
      { name: 'backspace' },
      {},
      setStateSpy,
      setWarningSpy,
      setInfoSpy,
      {
        ...state,
        selection: { ...state.selection, selectedColumn: 1 },
        cellInput: {
          ...state.cellInput,
          newValue: newValue,
          cursorPosition: newValue.length,
        },
      },
      config
    )

    expect(setWarningSpy).not.toHaveBeenCalled()
    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      selection: { ...state.selection, selectedColumn: 1 },
      cellInput: {
        ...state.cellInput,
        newValue: 'name',
        cursorPosition: newValue.length - 1,
      },
    })
  })
  it('should retain the existing empty value (backspace)', () => {
    handleEditKeypress(
      { name: 'backspace' },
      {},
      setStateSpy,
      setWarningSpy,
      setInfoSpy,
      {
        ...state,
        selection: { ...state.selection, selectedColumn: 1 },
        cellInput: {
          ...state.cellInput,
          newValue: '',
        },
      },
      config
    )

    expect(setWarningSpy).not.toHaveBeenCalled()
    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      selection: { ...state.selection, selectedColumn: 1 },
      cellInput: {
        ...state.cellInput,
        newValue: '',
      },
    })
  })
  it.each([
    ['a', 1, 'name', 'namea'],
    ['!', 1, 'name', 'name'],
    ['/', 2, 'http://sample.url', 'http://sample.url/'],
    ['1', 3, '3', '31'],
    ['@', 3, '3', '3'],
  ])(
    `should handle the new key pressed '%s', when editing column index %s and previous value of '%s'`,
    (
      character: string,
      selectedColumn: number,
      originalValue: string,
      updatedValue: string
    ) => {
      handleEditKeypress(
        { name: character },
        {
          line: character,
        },
        setStateSpy,
        setWarningSpy,
        setInfoSpy,
        {
          ...state,
          selection: { ...state.selection, selectedColumn: selectedColumn },
          cellInput: {
            ...state.cellInput,
            newValue: originalValue,
            cursorPosition: originalValue.length,
          },
        },
        config
      )

      expect(setWarningSpy).not.toHaveBeenCalled()
      expect(setStateSpy).toHaveBeenCalledWith({
        ...state,
        selection: { ...state.selection, selectedColumn: selectedColumn },
        cellInput: {
          ...state.cellInput,
          newValue: updatedValue,
          cursorPosition: updatedValue.length,
        },
      })
    }
  )
  it('should edit in the middle of the text', () => {
    handleEditKeypress(
      { name: 'a' },
      {
        line: 'a',
      },
      setStateSpy,
      setWarningSpy,
      setInfoSpy,
      {
        ...state,
        selection: { ...state.selection, selectedColumn: 1 },
        cellInput: {
          ...state.cellInput,
          newValue: '12345',
          cursorPosition: 2,
        },
      },
      config
    )

    expect(setWarningSpy).not.toHaveBeenCalled()
    expect(setStateSpy).toHaveBeenCalledWith({
      ...state,
      selection: { ...state.selection, selectedColumn: 1 },
      cellInput: {
        ...state.cellInput,
        newValue: '12a345',
        cursorPosition: 3,
      },
    })
  })
  it.each([
    ['left', 1, '12345', 5, 4],
    ['left', 1, '12345', 2, 1],
    ['left', 1, '12345', 1, 0],
    ['right', 1, '12345', 0, 1],
    ['right', 1, '12345', 2, 3],
    ['right', 1, '12345', 4, 5],
  ])(
    `should handle the new key pressed '%s', when editing column index %s, value of '%s', should adjust cursorPosition from %s to %s`,
    (
      keyName: string,
      selectedColumn: number,
      originalValue: string,
      cursorPositionFrom: number,
      cursorPositionTo: number
    ) => {
      handleEditKeypress(
        { name: keyName },
        {},
        setStateSpy,
        setWarningSpy,
        setInfoSpy,
        {
          ...state,
          selection: { ...state.selection, selectedColumn: selectedColumn },
          cellInput: {
            ...state.cellInput,
            newValue: originalValue,
            cursorPosition: cursorPositionFrom,
          },
        },
        config
      )

      expect(setWarningSpy).not.toHaveBeenCalled()
      expect(setStateSpy).toHaveBeenCalledWith({
        ...state,
        selection: { ...state.selection, selectedColumn: selectedColumn },
        cellInput: {
          ...state.cellInput,
          newValue: originalValue,
          cursorPosition: cursorPositionTo,
        },
      })
    }
  )
  it.each([
    ['left', 1, '12345', 0],
    ['right', 1, '12345', 5],
  ])(
    `should handle the new key pressed '%s', when editing column index %s, value of '%s', should not adjust the cursorPosition from %s`,
    (
      keyName: string,
      selectedColumn: number,
      originalValue: string,
      cursorPositionFrom: number
    ) => {
      handleEditKeypress(
        { name: keyName },
        {},
        setStateSpy,
        setWarningSpy,
        setInfoSpy,
        {
          ...state,
          selection: { ...state.selection, selectedColumn: selectedColumn },
          cellInput: {
            ...state.cellInput,
            newValue: originalValue,
            cursorPosition: cursorPositionFrom,
          },
        },
        config
      )

      expect(setWarningSpy).not.toHaveBeenCalled()
      expect(setStateSpy).not.toHaveBeenCalled()
    }
  )
})

describe('handleNavigationKeypress()', () => {
  let state: any
  let rows
  let config: any
  let done: any
  let setStatus: any
  let setState: any
  let setWarning: any
  let setInfo: any
  let setConfirmWithSave: any
  let setConfirmWithoutSave: any
  beforeEach(() => {
    done = jest.fn()
    setStatus = jest.fn()
    setState = jest.fn()
    setWarning = jest.fn()
    setInfo = jest.fn()
    setConfirmWithSave = jest.fn()
    setConfirmWithoutSave = jest.fn()
    state = {
      mode: {
        inEdit: false,
        inFilter: false,
        showNavigationHelp: false,
      },
      selection: {
        pageSize: 3,
        selectedRow: 0,
        selectedColumn: 0,
        firstVisibleRow: 0,
        lastVisibleRow: 2,
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
        sortedAsc: false,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }
    rows = structuredClone(testRows)
    config = {
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 3,
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
  it('should change the option selection when on unselected option (space)', () => {
    handleNavigationKeypress(
      { name: 'space' },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      state,
      false,
      false,
      config
    )

    expect(config.rows[0][0]).toBe(true)
    expect(state.rows[0][1]).toBe(true)
    expect(config.rows[1][0]).toBe(false)
    expect(state.rows[1][1]).toBe(false)
    expect(config.rows[2][0]).toBe(false)
    expect(state.rows[2][1]).toBe(false)
    expect(setWarning).toHaveBeenCalled()
  })
  it('should not change the option selection when on already selected option (space)', () => {
    handleNavigationKeypress(
      { name: 'space' },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      { ...state, selection: { ...state.selection, selectedRow: 1 } },
      false,
      false,
      config
    )

    expect(config.rows[0][0]).toBe(false)
    expect(state.rows[0][1]).toBe(false)
    expect(config.rows[1][0]).toBe(true)
    expect(state.rows[1][1]).toBe(true)
    expect(config.rows[2][0]).toBe(false)
    expect(state.rows[2][1]).toBe(false)
    expect(setWarning).not.toHaveBeenCalled()
  })
  it('should not change the option selection when not a radio column (space)', () => {
    handleNavigationKeypress(
      { name: 'space' },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      { ...state, selection: { ...state.selection, selectedColumn: 1 } },
      false,
      false,
      config
    )

    expect(config.rows[0][0]).toBe(false)
    expect(state.rows[0][1]).toBe(false)
    expect(config.rows[1][0]).toBe(true)
    expect(state.rows[1][1]).toBe(true)
    expect(config.rows[2][0]).toBe(false)
    expect(state.rows[2][1]).toBe(false)
    expect(setWarning).not.toHaveBeenCalled()
    expect(setInfo).toHaveBeenCalled()
  })
  it.each([['insert'], ['delete']])(
    'should not enter edit mode when on radio column (%s)',
    (key) => {
      handleNavigationKeypress(
        { name: key },
        done,
        setStatus,
        setState,
        setWarning,
        setInfo,
        setConfirmWithSave,
        setConfirmWithoutSave,
        state,
        false,
        false,
        config
      )

      expect(setInfo).toHaveBeenCalled()
      expect(setState).not.toHaveBeenCalled()
    }
  )
  it.each([['insert'], ['delete']])(
    'should not enter edit mode when on read-only column (%s)',
    (key) => {
      handleNavigationKeypress(
        { name: key },
        done,
        setStatus,
        setState,
        setWarning,
        setInfo,
        setConfirmWithSave,
        setConfirmWithoutSave,
        { ...state, selection: { ...state.selection, selectedColumn: 6 } },
        false,
        false,
        config
      )

      expect(setInfo).toHaveBeenCalled()
      expect(setState).not.toHaveBeenCalled()
    }
  )
  it.each([['insert'], ['delete']])(
    'should enter edit mode when on editable column (%s)',
    (key) => {
      handleNavigationKeypress(
        { name: key },
        done,
        setStatus,
        setState,
        setWarning,
        setInfo,
        setConfirmWithSave,
        setConfirmWithoutSave,
        { ...state, selection: { ...state.selection, selectedColumn: 1 } },
        false,
        false,
        config
      )

      expect(setInfo).not.toHaveBeenCalled()
      expect(setState).toHaveBeenCalledWith({
        ...state,
        mode: {
          ...state.mode,
          inEdit: true,
        },
        selection: {
          ...state.selection,
          selectedColumn: 1,
        },
        cellInput: {
          ...state.cellInput,
          newValue:
            key === 'delete' ? '' : config.rows[state.selection.selectedRow][1],
          cursorPosition:
            key === 'delete'
              ? 0
              : config.rows[state.selection.selectedRow][1].length,
        },
      })
    }
  )
  it('should present saving confirmation message (enter)', () => {
    handleNavigationKeypress(
      { name: 'enter' },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      state,
      false,
      false,
      config
    )

    expect(setConfirmWithSave).toHaveBeenCalled()
    expect(setConfirmWithoutSave).not.toHaveBeenCalled()
  })
  it('should save the changes (enter)', () => {
    handleNavigationKeypress(
      { name: 'enter' },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      state,
      true,
      false,
      config
    )

    expect(setConfirmWithSave).not.toHaveBeenCalled()
    expect(setConfirmWithoutSave).not.toHaveBeenCalled()
    expect(setStatus).toHaveBeenCalled()
    expect(done).toHaveBeenCalledWith(config.rows)
  })
  it('should present exit without saving confirmation message (escape)', () => {
    handleNavigationKeypress(
      { name: 'escape' },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      state,
      false,
      false,
      config
    )

    expect(setConfirmWithSave).not.toHaveBeenCalled()
    expect(setConfirmWithoutSave).toHaveBeenCalled()
  })
  it('should not save the changes (escape)', () => {
    handleNavigationKeypress(
      { name: 'escape' },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      state,
      false,
      true,
      config
    )

    expect(setConfirmWithSave).not.toHaveBeenCalled()
    expect(setConfirmWithoutSave).not.toHaveBeenCalled()
    expect(setStatus).toHaveBeenCalled()
    expect(done).toHaveBeenCalledWith(undefined)
  })
  it.each([
    ['right', 3, 0, 0, 0, 2, 0, 1, 0, 2], // usual right
    ['right', 3, 0, 6, 0, 2, 0, 0, 0, 2], // end of line, circle around
    ['left', 3, 0, 6, 0, 2, 0, 5, 0, 2], // usual left
    ['left', 3, 0, 0, 0, 2, 0, 6, 0, 2], // begining of line, circle around
    ['down', 3, 0, 0, 0, 2, 1, 0, 0, 2], // usual down
    ['down', 3, 2, 0, 0, 2, 0, 0, 0, 2], // end of line, circle back up
    ['down', 2, 0, 0, 0, 1, 1, 0, 0, 1], // down in the same view
    ['down', 2, 1, 0, 0, 1, 2, 0, 1, 2], // down in the next view
    ['down', 2, 2, 0, 1, 2, 0, 0, 0, 1], // down in the first view
    ['up', 3, 2, 0, 0, 2, 1, 0, 0, 2], // usual up
    ['up', 3, 0, 0, 0, 2, 2, 0, 0, 2], // first row, circle down
    ['up', 2, 2, 0, 1, 2, 1, 0, 1, 2], // up in the same view
    ['up', 2, 1, 0, 1, 2, 0, 0, 0, 1], // up in the previous view
    ['up', 2, 0, 0, 0, 1, 2, 0, 1, 2], // up in the last view
    ['tab', 3, 0, 0, 0, 2, 0, 1, 0, 2], // tab in the first row
    ['tab', 3, 0, 6, 0, 2, 1, 0, 0, 2], // tab at the end of intermediary row
    ['tab', 3, 2, 6, 0, 2, 0, 0, 0, 2], // tab at the end of last row
    ['tab', 2, 1, 6, 0, 1, 2, 0, 1, 2], // tab at the end of intermediary row (paginated)
    ['tab', 2, 2, 6, 1, 2, 0, 0, 0, 1], // tab at the end of last row (paginated)
    ['pageup', 3, 0, 0, 0, 2, 0, 0, 0, 2], // pageup on single page
    ['pageup', 2, 2, 0, 1, 2, 0, 0, 0, 1], // pageup to previous page (2 items per page)
    ['pageup', 2, 1, 0, 0, 1, 2, 0, 1, 2], // pageup to last page (2 items per page)
    ['pageup', 1, 2, 0, 2, 2, 1, 0, 1, 1], // pageup to previous page (1 item per page)
    ['pageup', 1, 0, 0, 0, 0, 2, 0, 2, 2], // pageup to last page (1 item per page)
    ['pagedown', 3, 1, 0, 0, 2, 0, 0, 0, 2], // pagedown on single page
    ['pagedown', 2, 1, 0, 0, 1, 2, 0, 1, 2], // pagedown to next page (2 items per page)
    ['pagedown', 2, 2, 0, 1, 2, 0, 0, 0, 1], // pagedown to first page (2 items per page)
    ['pagedown', 1, 1, 0, 1, 1, 2, 0, 2, 2], // pagedown to next page (1 items per page)
    ['pagedown', 1, 2, 0, 2, 2, 0, 0, 0, 0], // pagedown to first page (1 items per page)
    ['home', 3, 1, 0, 0, 2, 0, 0, 0, 2], // home on single page
    ['home', 1, 1, 0, 1, 1, 0, 0, 0, 0], // home on multi-page
    ['end', 3, 2, 0, 0, 2, 2, 0, 0, 2], // end on single page
    ['end', 1, 1, 0, 1, 1, 2, 0, 2, 2], // end on multi-page
  ])(
    'should navigate 3x7 table using (%s) on pageSize=%s, from (%s, %s) with visible rows [%s, %s] to (%s, %s) with visible rows [%s, %s]',
    (
      key,
      pageSize,
      fromRow,
      fromColumn,
      fromFirstVisibleRow,
      fromLastVisibleRow,
      toRow,
      toColumn,
      toFirstVisibleRow,
      toLastVisibleRow
    ) => {
      handleNavigationKeypress(
        { name: key },
        done,
        setStatus,
        setState,
        setWarning,
        setInfo,
        setConfirmWithSave,
        setConfirmWithoutSave,
        {
          ...state,
          selection: {
            ...state.selection,
            pageSize: pageSize,
            selectedRow: fromRow,
            selectedColumn: fromColumn,
            firstVisibleRow: fromFirstVisibleRow,
            lastVisibleRow: fromLastVisibleRow,
          },
        },
        false,
        false,
        config
      )

      expect(setState).toHaveBeenCalledWith({
        ...state,
        selection: {
          ...state.selection,
          pageSize: pageSize,
          selectedRow: toRow,
          selectedColumn: toColumn,
          firstVisibleRow: toFirstVisibleRow,
          lastVisibleRow: toLastVisibleRow,
        },
      })
    }
  )
  it.each([
    [3, 0, 0, 0, 2, 2, 6, 0, 2], // Shift+Tab at the beginning of first row
    [3, 1, 0, 0, 2, 0, 6, 0, 2], // Shift+Tab at the beginning of intermediary row
    [3, 2, 6, 0, 2, 2, 5, 0, 2], // Shift+Tab at the end of last row
    [2, 1, 0, 1, 2, 0, 6, 0, 1], // Shift+Tab at the beginning of intermediary row (paginated)
    [2, 0, 0, 0, 1, 2, 6, 1, 2], // Shift+Tab at the beginning of first row (paginated)
  ])(
    'should navigate 3x7 table using Shift+Tab on pageSize=%s, from (%s, %s) with visible rows [%s, %s] to (%s, %s) with visible rows [%s, %s]',
    (
      pageSize,
      fromRow,
      fromColumn,
      fromFirstVisibleRow,
      fromLastVisibleRow,
      toRow,
      toColumn,
      toFirstVisibleRow,
      toLastVisibleRow
    ) => {
      handleNavigationKeypress(
        { name: 'tab', shift: true },
        done,
        setStatus,
        setState,
        setWarning,
        setInfo,
        setConfirmWithSave,
        setConfirmWithoutSave,
        {
          ...state,
          selection: {
            ...state.selection,
            pageSize: pageSize,
            selectedRow: fromRow,
            selectedColumn: fromColumn,
            firstVisibleRow: fromFirstVisibleRow,
            lastVisibleRow: fromLastVisibleRow,
          },
        },
        false,
        false,
        config
      )

      expect(setState).toHaveBeenCalledWith({
        ...state,
        selection: {
          ...state.selection,
          pageSize: pageSize,
          selectedRow: toRow,
          selectedColumn: toColumn,
          firstVisibleRow: toFirstVisibleRow,
          lastVisibleRow: toLastVisibleRow,
        },
      })
    }
  )
  it('should enter filter mode (Shift+F)', () => {
    handleNavigationKeypress(
      { name: 'F', shift: true },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      state,
      false,
      false,
      config
    )
    expect(setState).toHaveBeenCalledWith({
      ...state,
      mode: { ...state.mode, inFilter: true },
    })
  })
  it('should sort ascending for sortable column (Shift+Up)', () => {
    handleNavigationKeypress(
      { name: 'up', shift: true },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      {
        ...state,
        selection: {
          ...state.selection,
          selectedColumn: 1,
        },
      },
      false,
      false,
      config
    )
    expect(setState).toHaveBeenCalledWith({
      ...state,
      selection: {
        ...state.selection,
        selectedColumn: 1,
      },
      sortInput: { sortedColumn: 1, sortedAsc: true },
    })
  })
  it('should remove sort when the column is already sorted ascending (Shift+Up)', () => {
    handleNavigationKeypress(
      { name: 'up', shift: true },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      {
        ...state,
        selection: {
          ...state.selection,
          selectedColumn: 1,
        },
        sortInput: { sortedColumn: 1, sortedAsc: true },
      },
      false,
      false,
      config
    )
    expect(setState).toHaveBeenCalledWith({
      ...state,
      selection: {
        ...state.selection,
        selectedColumn: 1,
      },
      sortInput: { sortedColumn: -1, sortedAsc: false },
    })
  })
  it('should not sort ascending if the column does not support it (Shift+Up)', () => {
    handleNavigationKeypress(
      { name: 'up', shift: true },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      state,
      false,
      false,
      config
    )
    expect(setState).not.toHaveBeenCalled()
  })
  it('should sort descending for sortable column (Shift+Down)', () => {
    handleNavigationKeypress(
      { name: 'down', shift: true },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      {
        ...state,
        selection: {
          ...state.selection,
          selectedColumn: 1,
        },
      },
      false,
      false,
      config
    )
    expect(setState).toHaveBeenCalledWith({
      ...state,
      selection: {
        ...state.selection,
        selectedColumn: 1,
      },
      sortInput: { sortedColumn: 1, sortedAsc: false },
    })
  })
  it('should remove sort when the column is already sorted descending (Shift+Down)', () => {
    handleNavigationKeypress(
      { name: 'down', shift: true },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      {
        ...state,
        selection: {
          ...state.selection,
          selectedColumn: 1,
        },
        sortInput: { sortedColumn: 1, sortedAsc: false },
      },
      false,
      false,
      config
    )
    expect(setState).toHaveBeenCalledWith({
      ...state,
      selection: {
        ...state.selection,
        selectedColumn: 1,
      },
      sortInput: { sortedColumn: -1, sortedAsc: false },
    })
  })
  it('should not sort descending if the column does not support it (Shift+Down)', () => {
    handleNavigationKeypress(
      { name: 'down', shift: true },
      done,
      setStatus,
      setState,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      state,
      false,
      false,
      config
    )
    expect(setState).not.toHaveBeenCalled()
  })
})

describe('handleKeypress()', () => {
  let state: any
  let rows
  let config: any
  let done: any
  let setStatus: any
  let setState: any
  let setError: any
  let setWarning: any
  let setInfo: any
  let setConfirmWithSave: any
  let setConfirmWithoutSave: any
  let testRl: any
  beforeEach(() => {
    done = jest.fn()
    setStatus = jest.fn()
    setState = jest.fn()
    setError = jest.fn()
    setWarning = jest.fn()
    setInfo = jest.fn()
    setConfirmWithSave = jest.fn()
    setConfirmWithoutSave = jest.fn()
    testRl = {
      line: '',
      clearLine: jest.fn(),
      setMaxListeners: jest.fn(),
    }
    state = {
      mode: {
        inEdit: true,
        inFilter: false,
        showNavigationHelp: false,
      },
      selection: {
        pageSize: 3,
        selectedRow: 0,
        selectedColumn: 0,
        firstVisibleRow: 0,
        lastVisibleRow: 2,
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
        sortedAsc: false,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }
    rows = structuredClone(testRows)
    config = {
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 3,
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
  it('should delegate keypress in filter mode', () => {
    handleKeypress(
      { name: 'escape' },
      testRl,
      done,
      setStatus,
      setState,
      setError,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      {
        ...state,
        mode: {
          inEdit: false,
          inFilter: true,
          showNavigationHelp: false,
        },
      },
      false,
      false,
      config
    )

    expect(done).not.toHaveBeenCalled()
    expect(setStatus).not.toHaveBeenCalled()
    expect(setState).toHaveBeenCalledWith({
      ...state,
      mode: {
        ...state.mode,
        inEdit: false,
        inFilter: false,
        showNavigationHelp: false,
      },
    })
    expect(setError).toHaveBeenLastCalledWith('')
    expect(setWarning).not.toHaveBeenCalled()
    expect(setInfo).toHaveBeenCalledWith(undefined)
    expect(testRl.clearLine).toHaveBeenCalledWith(0)
    expect(testRl.setMaxListeners).toHaveBeenCalledWith(0)
  })
  it('should delegate keypress in edit mode', () => {
    handleKeypress(
      { name: 'escape' },
      testRl,
      done,
      setStatus,
      setState,
      setError,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      state,
      false,
      false,
      config
    )

    expect(done).not.toHaveBeenCalled()
    expect(setStatus).not.toHaveBeenCalled()
    expect(setState).toHaveBeenCalledWith({
      ...state,
      mode: { ...state.mode, inEdit: false },
    })
    expect(setError).toHaveBeenLastCalledWith('')
    expect(setWarning).not.toHaveBeenCalled()
    expect(setInfo).toHaveBeenCalledWith(undefined)
    expect(testRl.clearLine).toHaveBeenCalledWith(0)
    expect(testRl.setMaxListeners).toHaveBeenCalledWith(0)
  })
  it('should delegate keypress in navigation mode', () => {
    handleKeypress(
      { name: 'escape' },
      testRl,
      done,
      setStatus,
      setState,
      setError,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      { ...state, mode: { ...state.mode, inEdit: false } },
      false,
      true,
      config
    )

    expect(done).toHaveBeenLastCalledWith(undefined)
    expect(setStatus).toHaveBeenCalledWith('done')
    expect(setState).not.toHaveBeenCalled()
    expect(setError).toHaveBeenLastCalledWith('')
    expect(setWarning).toHaveBeenCalledWith('')
    expect(setInfo).toHaveBeenCalledWith(undefined)
    expect(testRl.clearLine).toHaveBeenCalledWith(0)
    expect(testRl.setMaxListeners).toHaveBeenCalledWith(0)
  })
  it('should show the navigation help', () => {
    handleKeypress(
      { name: 'H' },
      testRl,
      done,
      setStatus,
      setState,
      setError,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      { ...state, mode: { ...state.mode, inEdit: false } },
      false,
      false,
      config
    )

    expect(done).not.toHaveBeenCalled()
    expect(setStatus).not.toHaveBeenCalled()
    expect(setState).toHaveBeenCalledWith({
      ...state,
      mode: { ...state.mode, inEdit: false, showNavigationHelp: true },
    })
    expect(setError).toHaveBeenLastCalledWith('')
    expect(setWarning).not.toHaveBeenCalled()
    expect(setInfo).toHaveBeenCalledWith(undefined)
    expect(testRl.clearLine).toHaveBeenCalledWith(0)
    expect(testRl.setMaxListeners).toHaveBeenCalledWith(0)
  })
  it('should prevent keypress effects when navigation help is displayed', () => {
    handleKeypress(
      { name: 'right' },
      testRl,
      done,
      setStatus,
      setState,
      setError,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      {
        ...state,
        mode: { ...state.mode, inEdit: false, showNavigationHelp: true },
      },
      false,
      false,
      config
    )

    expect(done).not.toHaveBeenCalled()
    expect(setStatus).not.toHaveBeenCalled()
    expect(setState).not.toHaveBeenCalled()
    expect(setError).toHaveBeenLastCalledWith('')
    expect(setWarning).not.toHaveBeenCalled()
    expect(setInfo).toHaveBeenCalledWith(undefined)
    expect(testRl.clearLine).toHaveBeenCalledWith(0)
    expect(testRl.setMaxListeners).toHaveBeenCalledWith(0)
  })
  it('should hide the navigation help', () => {
    handleKeypress(
      { name: 'h' },
      testRl,
      done,
      setStatus,
      setState,
      setError,
      setWarning,
      setInfo,
      setConfirmWithSave,
      setConfirmWithoutSave,
      {
        ...state,
        mode: { ...state.mode, inEdit: false, showNavigationHelp: true },
      },
      false,
      false,
      config
    )

    expect(done).not.toHaveBeenCalled()
    expect(setStatus).not.toHaveBeenCalled()
    expect(setState).toHaveBeenCalledWith({
      ...state,
      mode: { ...state.mode, inEdit: false, showNavigationHelp: false },
    })
    expect(setError).toHaveBeenLastCalledWith('')
    expect(setWarning).not.toHaveBeenCalled()
    expect(setInfo).toHaveBeenCalledWith(undefined)
    expect(testRl.clearLine).toHaveBeenCalledWith(0)
    expect(testRl.setMaxListeners).toHaveBeenCalledWith(0)
  })
})

describe('sortTableData()', () => {
  let state: any
  let rows
  let config: any
  beforeEach(() => {
    state = {
      mode: {
        inEdit: false,
        inFilter: false,
        showNavigationHelp: false,
      },
      selection: {
        pageSize: 1,
        selectedRow: 0,
        selectedColumn: 0,
        firstVisibleRow: 0,
        lastVisibleRow: 0,
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
        sortedAsc: false,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }
    rows = structuredClone(testRows)
    config = {
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 1,
    }
  })
  it('should not sort the table, but restore the orginal ordering', () => {
    state = {
      ...state,
      rows: testRows.map((row, idx) => [idx, ...row]).reverse(),
    }

    sortTableData(config, state)

    expect(state).toEqual({
      ...state,
      rows: testRows.map((row, idx) => [idx, ...row]),
    })
  })
  it('should sort ascending by text column', () => {
    state = {
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 2,
        selectedColumn: 1,
        firstVisibleRow: 2,
        lastVisibleRow: 2,
      },
      sortInput: {
        ...state.sortInput,
        sortedColumn: 1,
        sortedAsc: true,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }

    sortTableData(config, state)

    expect(state).toEqual({
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 2,
        selectedColumn: 1,
        firstVisibleRow: 2,
        lastVisibleRow: 2,
      },
      sortInput: {
        ...state.sortInput,
        sortedColumn: 1,
        sortedAsc: true,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    })
  })
  it('should sort descending by text column', () => {
    state = {
      ...state,
      sortInput: {
        ...state.sortInput,
        sortedColumn: 1,
        sortedAsc: false,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }

    sortTableData(config, state)

    expect(state).toEqual({
      ...state,
      sortInput: {
        ...state.sortInput,
        sortedColumn: 1,
        sortedAsc: false,
      },
      rows: testRows.map((row, idx) => [idx, ...row]).reverse(),
    })
  })
  it('should sort ascending by number column', () => {
    state = {
      ...state,
      sortInput: {
        ...state.sortInput,
        sortedColumn: 3,
        sortedAsc: true,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }

    sortTableData(config, state)

    expect(state).toEqual({
      ...state,
      sortInput: {
        ...state.sortInput,
        sortedColumn: 3,
        sortedAsc: true,
      },
      rows: testRows
        .map((row, idx) => [idx, ...row])
        .sort((a, b) => {
          return (
            Number(a[state.sortInput.sortedColumn + 1]) -
            Number(b[state.sortInput.sortedColumn + 1])
          )
        }),
    })
  })
  it('should sort descending by number column', () => {
    state = {
      ...state,
      sortInput: {
        ...state.sortInput,
        sortedColumn: 3,
        sortedAsc: false,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }

    sortTableData(config, state)

    expect(state).toEqual({
      ...state,
      sortInput: {
        ...state.sortInput,
        sortedColumn: 3,
        sortedAsc: false,
      },
      rows: testRows
        .map((row, idx) => [idx, ...row])
        .sort((a, b) => {
          return (
            Number(b[state.sortInput.sortedColumn + 1]) -
            Number(a[state.sortInput.sortedColumn + 1])
          )
        }),
    })
  })
})

describe('filterTableData()', () => {
  let state: any
  let rows
  let config: any
  beforeEach(() => {
    state = {
      mode: {
        inEdit: false,
        inFilter: true,
        showNavigationHelp: false,
      },
      selection: {
        pageSize: 1,
        selectedRow: 0,
        selectedColumn: 0,
        firstVisibleRow: 0,
        lastVisibleRow: 0,
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
        sortedAsc: false,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }
    rows = structuredClone(testRows)
    config = {
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 1,
    }
  })
  it('should filter the rows', () => {
    state = {
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 2,
        selectedColumn: 1,
        firstVisibleRow: 2,
        lastVisibleRow: 2,
      },
      filterInput: {
        ...state.filterInput,
        filterValue: 'ame3',
        filterPreviousValue: '',
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }

    filterTableData(config, state)

    expect(state).toEqual({
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 0,
        selectedColumn: 1,
        firstVisibleRow: 0,
        lastVisibleRow: 0,
      },
      filterInput: {
        ...state.filterInput,
        filterValue: 'ame3',
        filterPreviousValue: '',
      },
      rows: testRows.map((row, idx) => [idx, ...row]).slice(2),
    })
  })
  it('should un-filter the rows', () => {
    state = {
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 0,
        selectedColumn: 1,
        firstVisibleRow: 0,
        lastVisibleRow: 0,
      },
      filterInput: {
        ...state.filterInput,
        filterValue: 'ame3',
        filterPreviousValue: '',
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }

    filterTableData(config, state)

    expect(state).toEqual({
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 0,
        selectedColumn: 1,
        firstVisibleRow: 0,
        lastVisibleRow: 0,
      },
      filterInput: {
        ...state.filterInput,
        filterValue: 'ame3',
        filterPreviousValue: '',
      },
      rows: testRows.map((row, idx) => [idx, ...row]).slice(2),
    })
  })
})

describe('resetSortAndFilter()', () => {
  let state: any
  let rows
  let config: any
  beforeEach(() => {
    state = {
      mode: {
        inEdit: false,
        inFilter: false,
        showNavigationHelp: false,
      },
      selection: {
        pageSize: 1,
        selectedRow: 0,
        selectedColumn: 0,
        firstVisibleRow: 0,
        lastVisibleRow: 0,
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
        sortedAsc: false,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }
    rows = structuredClone(testRows)
    config = {
      message: 'Environments',
      columns: columns,
      rows: rows,
      pageSize: 1,
    }
  })
  it('should reset to original state when filter/sorting is applied', () => {
    state = {
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 2,
        selectedColumn: 1,
        firstVisibleRow: 2,
        lastVisibleRow: 2,
      },
      filterInput: {
        ...state.filterInput,
        filterValue: 'filterValue',
        filterPreviousValue: 'filterPreviousValue',
      },
      sortInput: {
        ...state.sortInput,
        sortedColumn: 1,
        sortedAsc: true,
      },
    }

    resetSortAndFilter(state, config, 0)

    expect(state).toEqual({
      ...state,
      selection: {
        ...state.selection,
        selectedColumn: 1,
      },
    })
  })
  it('should not reset to original state when filter/sorting is not applied', () => {
    state = {
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 2,
        firstVisibleRow: 2,
        lastVisibleRow: 2,
      },
    }

    resetSortAndFilter(state, config, 0)

    expect(state).toEqual({
      ...state,
      selection: {
        ...state.selection,
        selectedRow: 2,
        firstVisibleRow: 2,
        lastVisibleRow: 2,
      },
    })
  })
})

describe('generateHelpTip()', () => {
  it('should generate the reduced help tip for navigation mode', () => {
    const helpTip = generateHelpTip({
      mode: { inEdit: false, inFilter: false, showNavigationHelp: false },
    })
    expect(helpTip).toEqual(
      `(Press ${chalk.cyan.bold(
        '<H>'
      )} to toggle navigation help, ${chalk.cyan.bold(
        '<Enter>'
      )} to save the changes and ${chalk.cyan.bold('<Esc>')} to discard)`
    )
  })
  it('should generate the full help tip for navigation mode', () => {
    const helpTip = generateHelpTip({
      mode: { inEdit: false, inFilter: false, showNavigationHelp: true },
    })
    expect(helpTip).toEqual(
      `(Press ${chalk.cyan.bold(
        '<H>'
      )} to toggle navigation help, ${chalk.cyan.bold(
        '<Enter>'
      )} to save the changes and ${chalk.cyan.bold(
        '<Esc>'
      )} to discard)\n\nIn order to make changes, press ${chalk.cyan.bold(
        '<Space>'
      )} to set as current, ${chalk.cyan.bold('<Insert>')}/${chalk.cyan.bold(
        '<Delete>'
      )} to edit.\nUse ${chalk.cyan.bold('<Arrows>')} or ${chalk.cyan.bold(
        '<Tab>'
      )}/${chalk.cyan.bold(
        '<Shift + Tab>'
      )} to move between items.\nFor navigation between pages:\n - ${chalk.cyan.bold(
        '<PgUp>'
      )} goes to previous page, ${chalk.cyan.bold(
        '<PgDown>'
      )} to the next.\n - ${chalk.cyan.bold(
        '<Home>'
      )} takes you to the first page, ${chalk.cyan.bold(
        '<End>'
      )} to the last.\nSort the elements using ${chalk.cyan.bold(
        '<Shift + Up>'
      )}/${chalk.cyan.bold(
        '<Shift + Down>'
      )} or filter them using ${chalk.cyan.bold('<Shift + F>')}`
    )
  })
  it('should generate the help tip for edit mode', () => {
    const helpTip = generateHelpTip({
      mode: { inEdit: true, inFilter: false, showNavigationHelp: false },
    })
    expect(helpTip).toEqual(
      `(Press ${chalk.cyan.bold(
        '<Enter>'
      )} to update the value, ${chalk.cyan.bold('<Esc>')} to cancel editing)`
    )
  })
  it('should generate the help tip for filter mode', () => {
    const filterValue = 'filterValue'
    const helpTip = generateHelpTip({
      mode: { inEdit: false, inFilter: true, showNavigationHelp: false },
      filterInput: {
        filterValue: filterValue,
      },
    })
    expect(helpTip).toEqual(
      `${chalk.yellow('Filter')} (Press ${chalk.cyan.bold(
        '<Enter>'
      )} to apply, ${chalk.cyan.bold('<Esc>')} to discard): ${chalk.yellow(
        filterValue
      )}`
    )
  })
})

describe('generateUserMsg()', () => {
  it.each([
    ['', undefined, undefined, undefined, undefined, undefined],
    [
      chalk.red("you can't park there, mate!"),
      "you can't park there, mate!",
      undefined,
      undefined,
      undefined,
      undefined,
    ],
    [
      chalk.red('exit without saving?'),
      undefined,
      'exit without saving?',
      undefined,
      undefined,
      undefined,
    ],
    [
      chalk.green('exit and save changes?'),
      undefined,
      undefined,
      'exit and save changes?',
      undefined,
      undefined,
    ],
    [
      chalk.magenta("we're running out of colors in chalk"),
      undefined,
      undefined,
      undefined,
      "we're running out of colors in chalk",
      undefined,
    ],
    [
      chalk.yellow('you have been warned!'),
      undefined,
      undefined,
      undefined,
      undefined,
      'you have been warned!',
    ],
  ])(
    "should generate the user message '%s'",
    (
      expected: string | undefined,
      errorMsg: string | unknown,
      confirmWithoutSaveMsg: string | unknown,
      confirmWithSaveMsg: string | unknown,
      infoMsg: string | unknown,
      warningMsg: string | unknown
    ) => {
      const result = generateUserMsg(
        errorMsg,
        confirmWithoutSaveMsg,
        confirmWithSaveMsg,
        infoMsg,
        warningMsg
      )
      expect(result).toBe(expected)
    }
  )
})

describe('isValid()', () => {
  let state: any
  beforeEach(() => {
    state = {
      mode: {
        inEdit: true,
        inFilter: false,
        showNavigationHelp: false,
      },
      selection: {
        pageSize: 3,
        selectedRow: 0,
        selectedColumn: 0,
        firstVisibleRow: 0,
        lastVisibleRow: 1,
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
        sortedAsc: false,
      },
      rows: testRows.map((row, idx) => [idx, ...row]),
    }
  })
  it('should validate read-only column', () => {
    const result = isValid(state, {
      columns: [{ name: '', value: 'readonly' }],
    })
    expect(result).toBeTruthy()
  })
  it('should validate radio column', () => {
    const result = isValid(state, {
      columns: [{ name: '', value: 'current', editable: 'radio' }],
    })
    expect(result).toBeTruthy()
  })
  it('should validate checkbox column', () => {
    const result = isValid(state, {
      columns: [{ name: '', value: 'selected', editable: 'checkbox' }],
    })
    expect(result).toBeTruthy()
  })
  it('should validate text using internal function', () => {
    const result = isValid(
      { ...state, cellInput: { ...state.cellInput, newValue: 'new-value' } },
      {
        columns: [{ name: '', value: 'text', editable: 'text' }],
      }
    )
    expect(result).toBeTruthy()
  })
  it('should validate text using provided function', () => {
    const result = isValid(
      { ...state, cellInput: { ...state.cellInput, newValue: 'failing' } },
      {
        columns: [
          {
            name: '',
            value: 'text',
            editable: 'text',
            customValidation: (newValue: string) => {
              return newValue === 'passing'
            },
          },
        ],
      }
    )
    expect(result).toBeFalsy()
  })
})
