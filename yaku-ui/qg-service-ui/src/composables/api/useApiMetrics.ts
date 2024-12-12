// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { BaseParams } from '~/api/metrics'
import { computed } from 'vue'
import { currentEnv, currentNamespace } from './context'
import { useAuthHeaders } from './useAuthHeaders'

/** use the defaults of Yaku Core for coherence */
const DEFAULT = {
  ITEMS: '20',
  PAGE: '1',
  SORT_ORDER: 'DESC',
  SORT_BY: 'datetime',
}

/** modify the URL search params in place */
const setBaseParams = <T extends BaseParams>(url: URL, params: T) => {
  url.searchParams.append('items', params.items?.toString() ?? DEFAULT.ITEMS)
  url.searchParams.append('page', params.page?.toString() ?? DEFAULT.PAGE)
  url.searchParams.append('sortBy', params.sortBy ?? DEFAULT.SORT_BY)
  url.searchParams.append('sortOrder', params.sortOrder ?? DEFAULT.SORT_ORDER)
}

export const useApiMetrics = () => {
  const baseApiUrl = computed(() => `${currentEnv.value?.url}/api/v1`)

  const { getAuthHeader } = useAuthHeaders()

  const getBasicHeaders = (additionalHeaders: RequestInit['headers'] = {}) => ({
    ...getAuthHeader(),
    accept: 'application/json',
    'content-type': 'application/json',
    ...additionalHeaders,
  })

  type GetFindingsParams = BaseParams & { configId?: number }
  const getFindings = async (params: GetFindingsParams = {}) => {
    const url = new URL(
      `${baseApiUrl.value}/namespaces/${currentNamespace.value?.id}/metrics/findings`,
    )
    setBaseParams(url, params)
    if (params.configId !== undefined)
      url.searchParams.append('configId', params.configId.toString())

    return fetch(url, {
      headers: getBasicHeaders(),
    })
  }

  type GetFindingsInRangeParams = BaseParams & {
    startRange: Date
    endRange: Date
    configId?: number | string
  }
  const getFindingsInRange = async (params: GetFindingsInRangeParams) => {
    const url = new URL(
      `${baseApiUrl.value}/namespaces/${currentNamespace.value?.id}/metrics/findingsInRange`,
    )
    setBaseParams(url, params)
    url.searchParams.append('startRange', params.startRange.toISOString())
    url.searchParams.append('endRange', params.endRange.toISOString())
    if (params.configId)
      url.searchParams.append('configId', params.configId.toString())

    return fetch(url, {
      headers: getBasicHeaders(),
    })
  }

  type GetLatestRunFindingsParams = BaseParams
  const getLatestRunFindings = async (
    params: GetLatestRunFindingsParams = {},
  ) => {
    const url = new URL(
      `${baseApiUrl.value}/namespaces/${currentNamespace.value?.id}/metrics/LatestRunFindings`,
    )
    setBaseParams(url, params)

    return fetch(url, {
      headers: getBasicHeaders(),
    })
  }

  // TODO: implement this endpoint when needed
  // const getLatestRunFindingsInRange = async () => {
  //   const url = new URL('metrics/latestRunFindingsInRange', envUrl.value)
  //   url.searchParams.append('page', '1')

  //   return fetch(url, {
  //     headers: getBasicHeaders()
  //   })
  // }

  return {
    getFindings,
    getFindingsInRange,
    getLatestRunFindings,
    // getLatestRunFindingsInRange
  }
}
