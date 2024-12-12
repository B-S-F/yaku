// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Config } from '~/types'
import { useApiCore, type StoreContext } from '~api'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getStoreKey } from '~helpers'
import {
  type OperationResult,
  getApiError,
  getNetworkError,
} from './apiIntegration'

type ExtendedConfig = Config & { lastRunDate?: string }

type PushOptions = {
  itemRange?: [number, number]
}
export const configStore = () => {
  const apiCore = useApiCore()
  const configs = ref<ExtendedConfig[]>([])

  /** handle addition or update of configs */
  const push = (newConfigs: Config[], options: PushOptions = {}) => {
    const toAdd = newConfigs.reduce((acc, newConfig) => {
      const isAtIndex = configs.value.findIndex((r) => r.id === newConfig.id)
      if (isAtIndex === -1) {
        acc.push(newConfig)
      } else {
        updateAtIndex(isAtIndex, newConfig)
      }
      return acc
    }, [] as Config[])
    configs.value.push(...toAdd)
    // delete configurations that are not recieved
    const { itemRange } = options
    if (itemRange) {
      const [start, end] = itemRange
      const toDelete = configs.value.slice(start, end).reduce((acc, c) => {
        const configMatch = newConfigs.find((c2) => c2.id === c.id)
        if (!configMatch) {
          acc.push(c.id)
        }
        return acc
      }, [] as number[])
      toDelete.forEach(removeById)
    }
  }

  const updateAtIndex = (
    i: number,
    configData: Partial<ExtendedConfig | Config>,
  ) => {
    configs.value[i] = {
      ...configs.value[i], // Keep extra properties
      ...configData,
    }
  }

  const getById = (id: number) =>
    configs.value.find((c) => c.id.toString() === id.toString())

  const getOrFetch = async (
    configId: number,
  ): Promise<OperationResult<Config>> => {
    const resource = getById(configId)
    if (resource) return { ok: true, resource }
    try {
      const r = await apiCore.getConfig({ configId })
      if (r.ok) {
        const config = (await r.json()) as Config
        push([config])
        return { ok: true, resource: config }
      } else {
        return getApiError(r)
      }
    } catch (e) {
      return getNetworkError(e)
    }
  }

  const removeById = (id: number) => {
    const i = configs.value.findIndex((r) => r.id === id)
    if (i !== -1) configs.value.splice(i, 1)
  }

  const sortedConfigs = computed(() =>
    configs.value.sort((a, b) =>
      b.lastModificationTime.localeCompare(a.lastModificationTime),
    ),
  )

  return {
    configs,
    push,
    updateAtIndex,
    getById,
    getOrFetch,
    removeById,
    sortedConfigs,
  }
}

export const useConfigStore = (params: StoreContext) =>
  defineStore(getStoreKey('config', params), configStore, {
    persist: {
      storage: sessionStorage,
    },
  })()
