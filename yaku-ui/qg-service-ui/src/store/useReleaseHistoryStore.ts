// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SortOrder } from '~/api/common'
import { useApiNetworkError } from '~/composables/api'
import { useApiReleases } from '~/composables/api/useApiReleases'
import { ReleaseHistoryFilter, ReleaseHistoryItem } from '~/types/Release'

export type FetchReleasyHistoryOpts = {
  filter?: ReleaseHistoryFilter
  sort?: SortOrder
  reset?: boolean
}

const releaseHistoryStore = () => {
  const items = ref<ReleaseHistoryItem[]>([])
  const activeFilter = ref<ReleaseHistoryFilter | undefined>()
  const activeSort = ref<SortOrder>('DESC')
  const isLoading = ref<boolean>(false)
  const apiError = ref<string | undefined>()
  const next = ref<string | undefined>()
  const { getReleaseHistory } = useApiReleases()

  const fetchHistory = async (
    releaseId: number,
    opts: FetchReleasyHistoryOpts = {},
  ) => {
    try {
      isLoading.value = true
      if (opts.reset) {
        activeFilter.value = undefined
        activeSort.value = 'DESC'
      } else {
        if (opts.filter)
          activeFilter.value =
            opts.filter === activeFilter.value ? undefined : opts.filter
        if (opts.sort) activeSort.value = opts.sort
      }
      const r = await getReleaseHistory({
        releaseId,
        filter: activeFilter.value,
        sortOrder: activeSort.value,
      })
      if (r.ok) {
        const rjson = await r.json()
        items.value = rjson?.data
        if (rjson?.links?.next) {
          next.value = rjson?.links?.next
        }
      } else {
        apiError.value = (await r.json())?.message
      }
    } catch {
      apiError.value = useApiNetworkError()
    } finally {
      isLoading.value = false
    }
  }

  return {
    activeFilter,
    activeSort,
    items,
    next,
    isLoading,
    apiError,
    fetchHistory,
  }
}

export const useReleaseHistoryStore = defineStore(
  'releaseHistoryStore',
  releaseHistoryStore,
)
