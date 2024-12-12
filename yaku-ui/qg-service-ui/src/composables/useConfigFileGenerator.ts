// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { computed } from 'vue'
import type { Mapping } from '~/types'
import { useConfigRawFileGenerator } from './useConfigRawFileGenerator'
import { getSheetColumnNameFromIndex } from '~/utils/sheetColumnName'

/**
 * Params needed to generate the YAML file.
 * It doesn't match its schema though.
 */
export type UseConfigFileParams = {
  filename: string
  sheetName: string
  startRow: number
  endRow: number
  mappingList: Array<Mapping | null>
}
/** Params not reactive at the moment */
export const useConfigFileGenerator = (params: UseConfigFileParams) => {
  const { filename, sheetName, startRow, endRow, mappingList } = params

  const config = computed(() => {
    const mappedCols = mappingList.reduce(
      (acc, col, i) => {
        if (col) {
          acc.push([col.label.toLowerCase(), getSheetColumnNameFromIndex(i)])
        }
        return acc
      },
      [] as [string, string][],
    )

    return {
      sheet: sheetName,
      startRow,
      endRow,
      columns: mappedCols.map((x) => x!.join(': ')),
    }
  })

  const model = computed<string>(() => {
    const ymlConfig = config.value
    return [
      `sheet: ${ymlConfig.sheet}`,
      `startRow: ${ymlConfig.startRow}`,
      `endRow: ${ymlConfig.endRow}`,
      `columns:`,
      `  ${ymlConfig.columns.join('\n  ')}`,
    ]
      .filter((x) => x)
      .join('\n')
  })

  const file = useConfigRawFileGenerator({ filename, rawConfig: model }).file

  return {
    config,
    file,
  }
}
