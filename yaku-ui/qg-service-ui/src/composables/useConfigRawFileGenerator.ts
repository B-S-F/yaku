// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { computed, unref } from 'vue'
import type { MaybeRef } from '@vueuse/core'

/** Expected API MIME-Type */
const CONFIG_FILE_TYPE = 'application/x-yaml'

/**
 * Params needed to generate the YAML file.
 * It doesn't match its schema though.
 */
export type UseConfigFileParams = {
  filename: MaybeRef<string>
  rawConfig: MaybeRef<string>
}
/** Params not reactive at the moment */
export const useConfigRawFileGenerator = (params: UseConfigFileParams) => {
  const { filename, rawConfig } = params

  const file = computed<File>(
    () =>
      new File([unref(rawConfig)], unref(filename), { type: CONFIG_FILE_TYPE }),
  )

  return {
    file,
  }
}
