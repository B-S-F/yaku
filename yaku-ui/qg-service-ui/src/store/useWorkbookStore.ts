// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { UploadableFile } from '~/composables/useFileList'
import type { Config, Mapping, SelectItem } from '~/types'
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { WorkBook, utils } from 'xlsx'
import { COLUMN_MAPPING_ITEM } from '~/config/configurationCreation'

const INITIAL_SELECTED_SHEET = { value: '', label: '' }

/**
 * Store for the ExcelToConfig. It stores the data between the steps.
 */
const workbookStore = () => {
  const relatedConfig = ref<Config | null>(null)

  const file = ref<UploadableFile>()
  const workbook = ref<WorkBook>()
  const options = computed(() =>
    workbook.value?.SheetNames.map(
      (sheetName, key) =>
        <SelectItem>{
          value: sheetName,
          label: `(${key + 1}) ${sheetName}`,
        },
    ),
  )
  const selectedSheet = ref<SelectItem>(INITIAL_SELECTED_SHEET)
  const table = computed<[string][]>(() =>
    workbook.value && selectedSheet.value.value
      ? utils.sheet_to_json(workbook.value.Sheets[selectedSheet.value.value], {
          header: 1,
        })
      : [],
  )

  const range = ref({
    startRow: 1,
    endRow: 1,
  })

  // bound range
  const minRange = 1
  const maxRange = computed(() => table.value.length)

  const selectedHeaderRow = computed<typeof table.value>(() =>
    range.value.startRow > 1
      ? table.value?.slice(range.value.startRow - 2, range.value.startRow - 1)
      : ([[]] as unknown as typeof table.value),
  )
  const selectedRows = computed(() =>
    table.value?.slice(range.value.startRow - 1, range.value.endRow),
  )

  // select default sheet on workbook change
  watch(workbook, (wb, oldWb) => {
    const isSheetAlreadySelected = wb?.Sheets[selectedSheet.value.value]
    if (!wb?.SheetNames || isSheetAlreadySelected || wb === oldWb) return
    const sheetName = wb?.SheetNames[0]
    selectedSheet.value = <SelectItem>{
      label: `(1) ${sheetName}`,
      value: sheetName,
    }
  })

  // select default sheet properties on selectedSheet change
  watch(selectedSheet, (sheet, oldSheet) => {
    if (!sheet.value || !workbook.value || sheet.value === oldSheet.value)
      return

    range.value = {
      startRow: 1,
      endRow: table.value.length,
    }

    initAssignedMappingItems()
    initUnassignedMappingItems()
  })

  const unassignedMappingItems = ref<Mapping[]>([...COLUMN_MAPPING_ITEM])
  const assignedMappingItems = ref<Array<Mapping | null>>([])
  const isFilterMappingActive = ref(false)

  const initUnassignedMappingItems = () => {
    unassignedMappingItems.value = [...COLUMN_MAPPING_ITEM]
  }
  const initAssignedMappingItems = () => {
    const length =
      selectedRows.value?.reduce((acc, row) => Math.max(acc, row.length), 0) ??
      0
    assignedMappingItems.value = new Array(length).fill(null)
  }

  const reset = () => {
    file.value = undefined
    selectedSheet.value = INITIAL_SELECTED_SHEET
    relatedConfig.value = null
    initAssignedMappingItems()
    initUnassignedMappingItems()
    isFilterMappingActive.value = false
  }

  return {
    workbook,
    relatedConfig,
    options,
    selectedSheet,
    range,
    minRange,
    maxRange,
    table,
    selectedRows,
    selectedHeaderRow,
    file,
    unassignedMappingItems,
    assignedMappingItems,
    isFilterMappingActive,
    reset,
  }
}

export const useWorkbookStore = defineStore('workbook', workbookStore, {
  persist: {
    storage: sessionStorage,
    serializer: {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    },
  },
  share: {
    enable: false,
  },
})
