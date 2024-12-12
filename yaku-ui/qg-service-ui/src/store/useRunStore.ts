// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { GetRun, GetRuns } from '~/api'
import type { LocalRun, Run } from '~/types'
import { useApiCore, type StoreContext } from '~api'
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { getConfigIdFromEndpoint, getStoreKey } from '~helpers'
import { OperationResult, getApiError, getNetworkError } from './apiIntegration'
import { useIntervalFn } from '@vueuse/core'

const isApiRun = (run: Run | LocalRun): run is Run =>
  Object.hasOwn(run, 'config')
const apiRunToStore = (run: Run): LocalRun => {
  return {
    configId: getConfigIdFromEndpoint(run.config),
    ...run,
  }
}

const REFRESH_INTERVAL = 1000

const runStore = () => {
  const apiCore = useApiCore()
  const runs = ref<LocalRun[]>([])

  const getByConfigId = (id: number) => {
    return runs.value.filter((r) => r.configId === id)
  }

  const getOrFetchLastRun = async (
    configId: number,
  ): Promise<OperationResult<Run | undefined>> => {
    try {
      const r = await apiCore.getRunsOfConfig({
        pagination: { items: '1' },
        filter: { configId },
      })
      if (r.ok) {
        const { data } = (await r.json()) as GetRuns
        const run = data.at(0)
        if (run) push([run])
        return { ok: true, resource: run }
      } else {
        return getApiError(r)
      }
    } catch (e) {
      return getNetworkError(e)
    }
  }

  const runningRuns = computed(() =>
    runs.value.filter((r) => r.status === 'pending' || r.status === 'running'),
  )
  const _refreshRunningRuns = () =>
    runningRuns.value.forEach((run) =>
      apiCore
        .getRun({ runId: run.id })
        .then(async (r) => {
          if (!r.ok) return // silient the update error
          const refreshedRun = (await r.json()) as GetRun
          const atIndex = runs.value.findIndex(
            (testRun) => testRun.id === refreshedRun.id,
          )
          runs.value[atIndex] = apiRunToStore(refreshedRun)
        })
        .catch(console.error),
    )
  const { isActive, pause, resume } = useIntervalFn(
    _refreshRunningRuns,
    REFRESH_INTERVAL,
    { immediate: false },
  )

  watch(
    runningRuns,
    (newRuns) => {
      if (newRuns.length > 0 && !isActive.value) resume()
      else if (isActive.value && newRuns.length === 0) pause()
    },
    { flush: 'post' },
  )

  /** handle addition or update of runs */
  const push = (newRuns: (LocalRun | Run)[]) => {
    const toAdd = newRuns.reduce((acc, newRun) => {
      const isAtIndex = runs.value.findIndex((r) => r.id === newRun.id)
      const run = isApiRun(newRun) ? apiRunToStore(newRun) : newRun
      if (isAtIndex === -1) {
        acc.push(run)
      } else {
        updateAtIndex(isAtIndex, newRun)
      }
      return acc
    }, [] as LocalRun[])
    runs.value.push(...toAdd)
    runs.value.sort((a, b) => b.id - a.id)
  }

  const updateAtIndex = (i: number, runData: LocalRun | Run) => {
    runs.value[i] = {
      ...runs.value[i], // Keep ExtendedRun extra properties
      ...runData,
    }
  }

  const removeById = (id: number) => {
    const i = runs.value.findIndex((r) => r.id === id)
    if (i !== -1) runs.value.splice(i, 1)
  }

  return {
    runs,
    getByConfigId,
    getOrFetchLastRun,
    push,
    updateAtIndex,
    removeById,
  }
}

export const useRunStore = (context: StoreContext) =>
  defineStore(getStoreKey('run', context), runStore, {
    persist: {
      storage: sessionStorage,
    },
  })()
