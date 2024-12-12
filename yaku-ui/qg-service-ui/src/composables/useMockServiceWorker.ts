// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { onboardingWorker, onUnhandledRequest } from '~/mocks/browser'
import { useConfigStore } from '~/store/useConfigStore'
import { storeContext } from '~/composables/api'
import { useRunStore } from '~/store/useRunStore'
import { useReleaseStore } from '~/store/useReleaseStore'
import {
  useConfigsOverviewFetcher,
  useRunOverviewFetcher,
} from '~/composables/fetcher'
import { ref } from 'vue'
import type { Config, Run } from '~/types'
import { useReleasesOverviewFetcher } from '~/composables/fetcher/useReleasesOverviewFetcher'

export const useMockServiceWorker = () => {
  const configStore = useConfigStore(storeContext)
  const runStore = useRunStore(storeContext)
  const releaseStore = useReleaseStore(storeContext)

  const configsOfReleases = ref<Record<Config['id'], { name: string }>>({})
  const lastRunOfConfigs = ref<Record<Config['id'], Run | null | undefined>>({})
  const findingsOfConfig = ref<Record<Config['id'], { findingCount: number }>>(
    {},
  )
  const findingsOfRun = ref<Record<Run['id'], number | undefined>>({})

  const start = async () => {
    clearStores()
    await onboardingWorker.start({ onUnhandledRequest })
    await refetch()
  }

  const stop = async () => {
    clearStores()
    onboardingWorker.stop()
    await refetch()
  }

  const clearStores = () => {
    configStore.configs = []
    runStore.runs = []
    releaseStore.releases = []
  }

  const refetch = async () => {
    await refetchConfigs()
    await refetchReleases()
    await refetchRuns()
  }

  const refetchConfigs = async () => {
    const fetcher = useConfigsOverviewFetcher({
      lastRunOfConfigs,
      findingsOfConfig,
    })
    await fetcher.next()
  }

  const refetchReleases = async () => {
    const fetcher = useReleasesOverviewFetcher({
      findingsOfConfig,
      configsOfReleases,
    })
    await fetcher.next()
  }

  const refetchRuns = async () => {
    const fetcher = useRunOverviewFetcher({
      findingsOfRun,
      options: {
        groupBy: 'configuration',
      },
    })
    await fetcher.next()
  }

  return { start, stop, clearStores }
}
