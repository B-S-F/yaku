// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { type StoreContext } from '~api'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getStoreKey } from '~helpers'
import {
  getApiError,
  getNetworkError,
  type OperationResult,
} from './apiIntegration'
import { Release } from '~/types/Release'
import { useApiReleases } from '~/composables/api/useApiReleases'
import { ReleaseOverride } from '~/api'

type PushOptions = {
  itemRange?: [number, number]
  position?: 'top' | 'bottom'
}

export const releaseStore = () => {
  const releaseApi = useApiReleases()
  const releases = ref<Release[]>([])

  const push = (newReleases: Release[], options: PushOptions = {}) => {
    const toAdd = newReleases.reduce((acc, newRelease) => {
      const isAtIndex = releases.value.findIndex((r) => r.id === newRelease.id)
      if (isAtIndex === -1) {
        acc.push(newRelease)
      } else {
        updateAtIndex(isAtIndex, newRelease)
      }
      return acc
    }, [] as Release[])
    releases.value.push(...toAdd)
    const { itemRange } = options
    if (itemRange) {
      const [start, end] = itemRange
      const toDelete = releases.value.slice(start, end).reduce((acc, i) => {
        const releaseMatch = newReleases.find((r) => r.id === i.id)
        if (!releaseMatch) {
          acc.push(i.id)
        }
        return acc
      }, [] as number[])
      toDelete.forEach(removeById)
    }
  }

  const addRelease = (
    newReleases: Release[],
    options: PushOptions = { position: 'bottom' },
  ) => {
    const toAdd = newReleases.reduce((acc, newRelease) => {
      const isAtIndex = releases.value.findIndex((r) => r.id === newRelease.id)
      if (isAtIndex === -1) {
        acc.push(newRelease)
      } else {
        updateAtIndex(isAtIndex, newRelease)
      }
      return acc
    }, [] as Release[])

    if (options.position === 'top') {
      releases.value.unshift(...toAdd.reverse())
    } else {
      releases.value.push(...toAdd)
    }

    const { itemRange } = options
    if (itemRange) {
      const [start, end] = itemRange
      const toDelete = releases.value.slice(start, end).reduce((acc, i) => {
        const releaseMatch = newReleases.find((r) => r.id === i.id)
        if (!releaseMatch) {
          acc.push(i.id)
        }
        return acc
      }, [] as number[])
      toDelete.forEach(removeById)
    }
  }

  const updateAtIndex = (i: number, release: Partial<Release>) => {
    releases.value[i] = {
      ...releases.value[i],
      ...release,
    }
  }

  const updateRelease = (id: number | string, updates: Partial<Release>) => {
    const idx = releases.value.findIndex((r) => id === r.id)
    if (idx > 0) {
      releases.value[idx] = {
        ...releases.value[idx],
        ...updates,
      }
    }
  }

  const getById = (id: number | string) =>
    releases.value.find((r) => r.id.toString() === id.toString())

  const getOrFetch = async (
    releaseId: number | string,
  ): Promise<OperationResult<Release>> => {
    const resource = getById(releaseId)
    if (resource) return { ok: true, resource }
    try {
      const r = await releaseApi.getRelease({ releaseId: releaseId })
      if (r.ok) {
        const release = (await r.json()) as Release
        push([release])
        return { ok: true, resource: release }
      } else {
        return getApiError(r)
      }
    } catch (e) {
      return getNetworkError(e)
    }
  }

  const getReleaseOverrides = async (
    releaseId: number | string,
  ): Promise<OperationResult<ReleaseOverride[]>> => {
    try {
      const r = await releaseApi.getReleaseOverride({
        releaseId: Number(releaseId),
      })
      if (r.ok) {
        const releaseOverrides = await r.json()
        return { ok: true, resource: releaseOverrides }
      } else {
        return getApiError(r)
      }
    } catch (e) {
      return getNetworkError(e)
    }
  }

  const removeById = (id: number) => {
    const i = releases.value.findIndex((r) => r.id === id)
    if (i !== -1) releases.value.splice(i, 1)
  }

  return {
    releases,
    addRelease,
    push,
    updateRelease,
    updateAtIndex,
    getById,
    getOrFetch,
    removeById,
    getReleaseOverrides,
  }
}

export const useReleaseStore = (params: StoreContext) =>
  defineStore(getStoreKey('release', params), releaseStore, {
    persist: {
      storage: sessionStorage,
    },
  })()
