// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ReleaseOverride } from '~/api'
import { useApiReleases } from '~/composables/api/useApiReleases'
import { getApiError, getNetworkError } from './apiIntegration'

const useReleaseOverridestore = () => {
  const overrides = ref<ReleaseOverride[]>([])
  const { getReleaseOverride } = useApiReleases()
  const getReleaseOverrides = async (releaseId: number | string) => {
    try {
      const r = await getReleaseOverride({ releaseId: Number(releaseId) })
      if (!r.ok) {
        const error = getApiError(r)
        throw new Error((await error).error.msg)
      }
      overrides.value = await r.json()
    } catch (e) {
      const error = e instanceof Error ? e.message : getNetworkError(e)
      console.error('Error fetching overrides: ', error)
    }
  }
  return {
    overrides,
    getReleaseOverrides,
  }
}

export default () =>
  defineStore('release-overrides-store', useReleaseOverridestore)()
