// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { computed } from 'vue'
import { currentEnv } from './context'
import { useAuthHeaders } from './useAuthHeaders'

const BASE_API_PATH = 'api/v1'

export const useApiAppCatalog = () => {
  const { getAuthHeader } = useAuthHeaders()

  const getBasicHeaders = (additionalHeaders: RequestInit['headers'] = {}) => ({
    ...getAuthHeader(),
    accept: 'application/json',
    'content-type': 'application/json',
    ...additionalHeaders,
  })

  const baseApiUrl = computed(
    () => `${currentEnv.value?.appCatalogApi}/${BASE_API_PATH}/`,
  )

  // ------
  //  Apps
  // ------
  type GetAppsParams = {
    includeParams?: boolean
  }
  const getApps = async (params: GetAppsParams = {}) => {
    const url = new URL('apps', baseApiUrl.value)
    if (params.includeParams) url.searchParams.append('includeParams', 'true')

    const r = fetch(url, {
      headers: getBasicHeaders(),
    })

    return r
  }

  return {
    getApps,
  }
}
