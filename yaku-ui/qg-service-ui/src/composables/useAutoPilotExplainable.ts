// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ref } from 'vue'
import { GetAutoPilotExplanationParams } from '~/api'
import { useApiCore, useApiNetworkError } from './api'
import { provideRequestError } from '~/helpers'

const useAutoPilotExplainable = () => {
  const show = ref<boolean>(false)
  const apiError = ref<string>()
  const explanation = ref<string>()
  const isLoading = ref<boolean>(false)
  const { getAutopilotExplanation } = useApiCore()
  const get = async (params: GetAutoPilotExplanationParams) => {
    try {
      isLoading.value = true
      show.value = true
      const response = await getAutopilotExplanation(params)
      if (response.ok) {
        explanation.value = (await response.json())?.explanation
      } else {
        apiError.value = await provideRequestError(response)
      }
    } catch {
      apiError.value = useApiNetworkError()
    } finally {
      isLoading.value = false
    }
  }

  return {
    show,
    apiError,
    explanation,
    isLoading,
    get,
  }
}
export default useAutoPilotExplainable
