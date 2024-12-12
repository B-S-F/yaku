// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Ref } from 'vue'
import type { GetConfigs, GetFindings, GetRuns, ApiError } from '~/api'
import type { Config, Run } from '~/types'
import { useConfigStore } from '~/store/useConfigStore'
import {
  DEFAULT_ITEMS_PER_PAGE,
  storeContext,
  useApiCore,
  useApiFinding,
  useApiNetworkError,
} from '~api'
import { ref } from 'vue'
import { getConfigIdFromEndpoint, provideRequestError } from '~/helpers'

type useConfigsOverviewFetcherParams = {
  lastRunOfConfigs: Ref<Record<Config['id'], Run | null | undefined>>
  findingsOfConfig: Ref<Record<Config['id'], { findingCount: number }>>
}
export const useConfigsOverviewFetcher = ({
  lastRunOfConfigs,
  findingsOfConfig,
}: useConfigsOverviewFetcherParams) => {
  const apiCore = useApiCore()
  const apiFinding = useApiFinding()

  const configStore = useConfigStore(storeContext)

  const currentPageFetched = ref(0)
  const hasAllItems = ref(false)
  const isFetching = ref(false)
  const error = ref<string>()

  /**
   * Helper for getNextConfigs
   * It populates findingsofConfig
   */
  const getFindingsOfConfigs = async (ids: number[]) => {
    const requests = ids.map(async (id) => {
      const r = await apiFinding.getFindings({
        pagination: { items: '1' },
        filters: { configId: id.toString(), hideResolved: true },
      })
      if (r.ok) {
        const findings = (await r.json()) as GetFindings
        findingsOfConfig.value[id] = {
          findingCount: findings.pagination?.totalCount ?? 0,
        }
      } else if (!error.value) {
        error.value = await provideRequestError(r)
      }
    })
    return Promise.allSettled(requests)
  }

  /**
   * Helper for getNextConfigs
   * It populates lastRunOfConfigs
   */
  const getLastRunOfConfigs = async (configIds: number[], items: string) => {
    const r = await apiCore.getLastRunOfConfigs({
      pagination: { items, page: '1' },
      filter: { configIds },
    })
    if (!r.ok) {
      error.value = await provideRequestError(r)
      return
    }
    const runs = (await r.json()) as GetRuns
    configIds.forEach((id) => (lastRunOfConfigs.value[id] = null))
    runs.data.forEach((run) => {
      const ofConfigId = getConfigIdFromEndpoint(run.config)
      lastRunOfConfigs.value[ofConfigId] = run
    })
  }

  const getNextConfigs = async (
    opts: { chunk?: string; onlyConfigs?: boolean } = { onlyConfigs: false },
  ) => {
    const CHUNK = opts.chunk ?? '20'
    isFetching.value = true
    try {
      const page = currentPageFetched.value + 1
      const r = await apiCore.getConfigs({
        sortBy: 'lastModificationTime',
        sortOrder: 'DESC',
        pagination: { items: CHUNK, page: page.toString() },
      })
      if (!r.ok) {
        error.value = ((await r.json()) as ApiError).message
        isFetching.value = false
        return
      }
      const { data, pagination } = (await r.json()) as GetConfigs
      configStore.push(data, {
        itemRange: [
          Math.max(0, (page - 1) * DEFAULT_ITEMS_PER_PAGE),
          page * DEFAULT_ITEMS_PER_PAGE,
        ],
      })
      const configIds = data.map((c) => c.id)
      if (!opts.onlyConfigs) {
        await Promise.allSettled([
          getLastRunOfConfigs(configIds, CHUNK),
          getFindingsOfConfigs(configIds),
        ])
      }
      hasAllItems.value =
        configStore.configs.length >= pagination?.totalCount ||
        pagination?.pageSize === 0
      isFetching.value = false
      currentPageFetched.value += 1
    } catch (e) {
      isFetching.value = false
      error.value = useApiNetworkError()
    }
  }

  const all = async ({ onlyConfigs = false }: { onlyConfigs?: boolean }) => {
    while (!error.value && !hasAllItems.value) {
      await getNextConfigs({ chunk: '100', onlyConfigs })
    }
  }

  return {
    error,
    isFetching,
    hasAllItems,
    next: getNextConfigs,
    all,
  }
}
