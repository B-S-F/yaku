// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { GetFindingsParams } from '~/api/findings'
import type { Finding } from '~/types'
import { computed } from 'vue'
import { currentEnv, currentNamespace } from './context'
import { useAuthHeaders } from './useAuthHeaders'
import { setApiPaginationParams } from './helpers'

/** namespaceId must be defined as useApiCore is. */
const namespaceId = computed(() => currentNamespace.value!.id)

/**
 * Separate API composable that relies on useApiCore currentNamespace to consume the Finding API.
 *
 * Depending of the needs, it can be merged into useApiCore to make the different api transparent to the UI developer.
 */
export const useApiFinding = () => {
  const { getAuthHeader } = useAuthHeaders()

  const baseApiUrl = computed(() => `${currentEnv.value?.url}/api/v1`)

  const getFindings = async ({
    pagination = {},
    filters = {},
    ...params
  }: GetFindingsParams = {}) => {
    const url = new URL(
      `${baseApiUrl.value}/namespaces/${namespaceId.value}/findings`,
    )
    setApiPaginationParams(url, {
      items: pagination.items ?? '100',
      page: pagination.page,
    })
    if (params.sortBy) url.searchParams.append('sortBy', params.sortBy)
    if (params.sortOrder) url.searchParams.append('sortOrder', params.sortOrder)
    if (filters.search) url.searchParams.append('search', filters.search)
    if (filters.hideResolved)
      url.searchParams.append('filter', 'status=unresolved')
    if (filters.hideResolved === false)
      url.searchParams.append('filter', 'status=resolved')
    if (typeof filters.hideResolved === 'undefined') {
      url.searchParams.delete('filter')
    }
    if (filters.id) url.searchParams.append('filter', `id=${filters.id}`)
    if (filters.runId)
      url.searchParams.append('filter', `runId=${filters.runId}`)
    if (filters.configId)
      url.searchParams.append('filter', `configId=${filters.configId}`)

    const r = await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    })
    return r
  }

  type GetFindingParams = {
    id: string
  }
  const getFinding = async (params: GetFindingParams) => {
    const url = new URL(
      `${baseApiUrl.value}/namespaces/${namespaceId.value}/findings/${params.id}`,
    )
    const r = await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    })
    return r
  }

  const updateFinding = async (
    finding: Pick<Finding, 'id'> & Partial<Finding>,
  ) => {
    const { id, ...payload } = finding
    const r = fetch(
      `${baseApiUrl.value}/namespaces/${namespaceId.value}/findings/${id}`,
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      },
    )
    return r
  }

  return {
    getAuthHeader,
    getFindings,
    getFinding,
    updateFinding,
  }
}
