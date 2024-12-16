// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { GetRuns, GetFindings } from '~/api'
import type { Config, Run } from '~/types'
import { type Ref, ref, MaybeRef, watch } from 'vue'
import {
  storeContext,
  useApiCore,
  useApiFinding,
  useApiNetworkError,
} from '~api'
import { useRunStore } from '~/store/useRunStore'
import { useConfigStore } from '~/store/useConfigStore'
import { getConfigIdFromEndpoint, provideRequestError } from '~/helpers'

type UseRunOverviewFetcherParams = {
  findingsOfRun: Ref<Record<Run['id'], number | undefined>>
  options: {
    groupBy: MaybeRef<'configuration' | undefined>
  }
}
export const useRunOverviewFetcher = (params: UseRunOverviewFetcherParams) => {
  const isFetching = ref(true)
  const hasAllItems = ref(false)
  const nextPage = ref(1)
  const error = ref<string>()

  /**
   * Set the fetcher to its original state
   */
  const _reset = () => {
    isFetching.value = false
    hasAllItems.value = false
    nextPage.value = 1
    error.value = ''
  }

  const apiCore = useApiCore()
  const apiFinding = useApiFinding()

  const configStore = useConfigStore(storeContext)
  const runStore = useRunStore(storeContext)

  const fetchFindingAmount = async (runId: number) => {
    let findingAmount: number | undefined = undefined
    try {
      const r = await apiFinding.getFindings({
        pagination: { items: '1' },
        filters: { runId: runId.toString(), hideResolved: true },
      })
      findingAmount = r.ok
        ? (((await r.json()) as GetFindings)?.pagination?.totalCount ?? 0)
        : undefined
    } catch (e) {
      console.error(e)
    }
    params.findingsOfRun.value[runId] = findingAmount
  }

  /**
   * Fetch all configurations,
   * then the first run of each configuration
   * and their related finding amount.
   */
  const fetchView = async () => {
    isFetching.value = true

    if (hasAllItems.value) return

    const runs: Run[] = []
    const r = await apiCore.getLastRunOfConfigs({
      pagination: { items: '20', page: `${nextPage.value}` },
    })
    try {
      if (r.ok) {
        const { data, links } = (await r.json()) as GetRuns
        runs.push(...data)
        nextPage.value += 1
        hasAllItems.value = !links.next
      } else {
        error.value = await provideRequestError(r)
      }
    } catch (e) {
      error.value = useApiNetworkError()
    }

    const configs: Config[] = []
    const configFetches = runs
      .map((c) => getConfigIdFromEndpoint(c.config))
      .map(async (configId) => {
        try {
          const r = await apiCore.getConfig({ configId })
          if (r.ok) {
            const config = (await r.json()) as Config
            configs.push(config)
            return config
          }
        } catch (e) {
          // do not catch errors
        }
        throw Error()
      })
    await Promise.allSettled(configFetches)
    runs
      .filter((r) => r.status === 'completed' || r.status === 'failed')
      .forEach((r) => fetchFindingAmount(r.id))
    configStore.push(configs)
    if (runStore && typeof runStore.push === 'function') runStore.push(runs)
    isFetching.value = false
  }

  // set the initial fetch depending of the groupBy value
  watch(
    () => params.options.groupBy,
    (newVal, oldVal) => {
      if (newVal === 'configuration' && newVal !== oldVal) {
        _reset()
        fetchView()
      }
    },
    { immediate: true },
  )

  return {
    hasAllItems,
    isFetching,
    next: fetchView,
    error,
  }
}
