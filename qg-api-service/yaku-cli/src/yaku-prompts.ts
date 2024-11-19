import * as inquirer from '@inquirer/prompts'
import yakuTablePrompt from './extensions/yaku-table-prompt.js'
import open from 'open'
import cp from 'child_process'

export type TableColumn = {
  name: string
  value: string | number | undefined
  editable?: 'url' | 'text' | 'number' | 'decimal' | 'radio' | 'checkbox'
  customValidation?: (value: string) => boolean
  sortable?: boolean
  filterable?: boolean
}

export type TableStyle = {
  radioOff: string
  radioOn: string
  checkboxOff: string
  checkboxOn: string
  scrollHead: string
  scrollSingle: string
  scrollUp: string
  scrollDown: string
  emptyValue: string
  sortedAsc: string
  sortedDesc: string
  valueTextValid: (value: string) => string
  valueBgValid: (value: string) => string
  valueTextInvalid: (value: string) => string
  valueBgInvalid: (value: string) => string
}

export type TableConfig = {
  message: string
  columns: TableColumn[]
  rows: (string | number | boolean)[][]
  pageSize?: number
  initWithSelectedRow?: number
  style?: TableStyle
}

async function confirm(msg: string): Promise<boolean> {
  return inquirer.confirm({ message: msg })
}

async function input(msg: string, defaultValue?: string): Promise<string> {
  return inquirer.input({ message: msg, default: defaultValue })
}

async function select(
  msg: string,
  choices: { name: string; value: string }[],
): Promise<string> {
  return await inquirer.select({
    message: msg,
    choices: choices,
  })
}

async function search(
  msg: string,
  choices: { name: string; value: string }[],
  itemsPerPage?: number,
): Promise<string> {
  return await inquirer.search({
    message: msg,
    pageSize: itemsPerPage ? itemsPerPage : 10,
    source: async (input) => {
      if (!input) {
        return choices
      }
      return choices.filter((item) => item.value.indexOf(input) > -1)
    },
  })
}

async function createTablePrompt(
  config: TableConfig,
): Promise<any[] | undefined> {
  return (await yakuTablePrompt(config)) as any[] | undefined
}

async function openFileInEditor(filePath: string, editor?: string) {
  if (editor) {
    cp.spawn(editor, [filePath], {
      stdio: 'inherit',
    })
  } else {
    open(filePath)
  }
}

export default {
  confirm,
  input,
  select,
  search,
  createTablePrompt,
  openFileInEditor,
}
