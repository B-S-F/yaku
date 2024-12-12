// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ref } from 'vue'
import { useApiReleases } from '../api/useApiReleases'
import { useApiNetworkError } from '../api'

const useCloseReleaseDialog = () => {
  const showCloseReleaseDialog = ref<boolean>(false)
  const { closeRelease } = useApiReleases()
  const handleCloseRelease = async (releaseId: number) => {
    try {
      const r = await closeRelease({ releaseId })
      if (r.ok) {
        return Promise.resolve(true)
      } else {
        return Promise.reject((await r.json())?.message)
      }
    } catch {
      return Promise.reject(useApiNetworkError())
    } finally {
      showCloseReleaseDialog.value = false
    }
  }

  return {
    showCloseReleaseDialog,
    handleCloseRelease,
  }
}

export default useCloseReleaseDialog
