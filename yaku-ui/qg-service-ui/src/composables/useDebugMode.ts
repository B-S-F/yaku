// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useUrlSearchParams } from '@vueuse/core'
import { computed, Ref, watchEffect, watch } from 'vue'

const URL_QUERY_KEY = 'show-error'
const ERROR_PLACEHOLDER =
  'This error message is a placeholder and must be replaced by the appropriate, meaningful error message.'
const params = useUrlSearchParams('hash')
const toggleDebugMode = () => {
  params[URL_QUERY_KEY] = params[URL_QUERY_KEY]
    ? (undefined as unknown as string)
    : 'true'
}
const isDebugModeActive = computed(() => !!params[URL_QUERY_KEY])

type UseDebugModeParams = {
  errorState?: Ref<string | undefined>
}
export const useDebugMode = ({ errorState }: UseDebugModeParams = {}) => {
  if (errorState) {
    watchEffect(() => {
      if (isDebugModeActive.value) {
        errorState.value = ERROR_PLACEHOLDER
      } else {
        errorState.value = undefined
      }
    })

    watch(errorState, (newVal, oldVal) => {
      const isErrorClose = !newVal && oldVal && isDebugModeActive.value
      if (isErrorClose) toggleDebugMode()
    })
  }

  return {
    isDebugModeActive,
    toggleDebugMode,
    errorPlaceholder: ERROR_PLACEHOLDER,
  }
}
