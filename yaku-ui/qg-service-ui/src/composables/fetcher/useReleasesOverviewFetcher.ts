// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Ref } from 'vue'
import type { GetFindings, ApiError, GetReleases } from '~/api'
import type { Config } from '~/types'
import {
  DEFAULT_ITEMS_PER_PAGE,
  storeContext,
  useApiFinding,
  useApiNetworkError,
} from '~api'
import { ref } from 'vue'
import { provideRequestError } from '~/helpers'
import { useApiReleases } from '../api/useApiReleases'
import { useReleaseStore } from '~/store/useReleaseStore'
import { useConfigStore } from '~/store/useConfigStore'

type useReleasesOverviewFetcherParams = {
  configsOfReleases: Ref<Record<Config['id'], { name: string }>>
  findingsOfConfig: Ref<Record<Config['id'], { findingCount: number }>>
}
export const useReleasesOverviewFetcher = ({
  findingsOfConfig,
  configsOfReleases,
}: useReleasesOverviewFetcherParams) => {
  // const apiCore = useApiCore()
  const releaseApi = useApiReleases()
  const apiFinding = useApiFinding()

  const releasesStore = useReleaseStore(storeContext)
  const configStore = useConfigStore(storeContext)

  const currentPageFetched = ref(0)
  const hasAllItems = ref(false)
  const isFetching = ref(false)
  const error = ref<string>()

  /**
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
  // const getLastRunOfConfigs = async (configIds: number[], items: string) => {
  //   const r = await apiCore.getLastRunOfConfigs({ pagination: { items, page: '1' }, filter: { configIds } })
  //   if (!r.ok) {
  //     error.value = await provideRequestError(r)
  //     return
  //   }
  //   const runs = (await r.json()) as GetRuns
  //   configIds.forEach((id) => (lastRunOfConfigs.value[id] = null))
  //   runs.data.forEach((run) => {
  //     const ofConfigId = getConfigIdFromEndpoint(run.config)
  //     lastRunOfConfigs.value[ofConfigId] = run
  //     releasesStore.releases.forEach((r, idx) => {
  //       if (r.qgConfigId === ofConfigId) releasesStore.updateAtIndex(idx, { lastRun: run })
  //     })
  //   })
  // }

  /**
   * Populates configs
   */

  const getConfigsOfReleases = async (configIds: number[]) => {
    const requests = configIds.map(async (id: number) => {
      const r = await configStore.getOrFetch(id)
      if (r.ok) {
        configsOfReleases.value[id] = r.resource
      }
    })
    return Promise.allSettled(requests)
  }

  const getNextReleases = async (opts: { chunk?: string } = {}) => {
    const CHUNK = opts.chunk ?? '20'
    isFetching.value = true
    try {
      const page = currentPageFetched.value + 1
      const r = await releaseApi.getReleases({
        sortOrder: 'DESC',
        items: CHUNK,
        page: page.toString(),
      })
      if (!r.ok) {
        error.value = ((await r.json()) as ApiError).message
        isFetching.value = false
        return
      }

      const { data, pagination } = (await r.json()) as GetReleases
      releasesStore.push(data, {
        itemRange: [
          Math.max(0, (page - 1) * DEFAULT_ITEMS_PER_PAGE),
          page * DEFAULT_ITEMS_PER_PAGE,
        ],
      })
      const configIds = data.map((c) => c.qgConfigId)
      await Promise.allSettled([
        // getLastRunOfConfigs(configIds, CHUNK),
        getFindingsOfConfigs(configIds),
        getConfigsOfReleases(configIds),
      ])
      isFetching.value = false
      currentPageFetched.value += 1
      hasAllItems.value =
        releasesStore.releases.length >= pagination?.totalCount ?? 0
    } catch (e) {
      isFetching.value = false
      error.value = useApiNetworkError()
    }
  }

  const all = async () => {
    // TODO: add pagination functionality again
    currentPageFetched.value = 0
    await getNextReleases({ chunk: '100' })
  }

  return {
    error,
    isFetching,
    hasAllItems,
    next: getNextReleases,
    all,
  }
}
