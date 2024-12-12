// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type {
  ApiError,
  SingleCheck,
  SecretPost,
  SecretUpdate,
  GetAutoPilotExplanationParams,
} from '~/api'
import type {
  PaginationParam,
  PaginationRequestParams,
  SortOrderParam,
} from '~/api/common'
import type { Config, Secret } from '~/types'
import { computed } from 'vue'
import { useApiNetworkError } from './useApiNetworkError'
import { setApiPaginationParams, setApiSortOrderParam } from './helpers'
import { currentEnv, currentNamespace } from './context'
import { useAuthHeaders } from './useAuthHeaders'

const baseApiUrl = computed(() => `${currentEnv.value?.url}/api/v1`)

export const useApiCore = () => {
  const { getAuthHeader } = useAuthHeaders()

  /** Step 3.1 */
  const getNamespaces = async () => {
    const r = await fetch(`${baseApiUrl.value}/namespaces`, {
      headers: {
        ...(await getAuthHeader()),
      },
    })
    return r
  }

  const envUrl = computed(
    () => `${baseApiUrl.value}/namespaces/${currentNamespace.value?.id}`,
  )

  // =========
  //  Secrets
  // =========
  const getSecrets = async ({ pagination }: PaginationParam = {}) => {
    const url = new URL(`${envUrl.value}/secrets`)
    setApiPaginationParams(url, pagination)
    const r = await fetch(url, {
      headers: {
        ...(await getAuthHeader()),
      },
    })
    return r
  }

  const postSecret = async (secret: SecretPost) => {
    const url = new URL(`${envUrl.value}/secrets`)
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        ...(await getAuthHeader()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(secret),
    })
    return r
  }

  const patchSecret = async (secret: SecretUpdate) => {
    const { name, ...payload } = secret
    const url = new URL(`${envUrl.value}/secrets/${name}`)
    const r = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...(await getAuthHeader()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    return r
  }

  const deleteSecret = async (secretName: Secret['name']) => {
    const url = new URL(`${envUrl.value}/secrets/${secretName}`)
    const r = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...(await getAuthHeader()),
        'Content-Type': 'application/json',
      },
    })
    return r
  }

  // =========
  //  Configs
  // =========
  type GetConfigsParams = PaginationParam & {
    sortOrder?: 'ASC' | 'DESC'
    sortBy?: keyof Config
  }
  const getConfigs = async ({
    pagination,
    sortOrder,
    sortBy,
  }: GetConfigsParams = {}) => {
    const url = new URL(`${envUrl.value}/configs`)
    setApiPaginationParams(url, pagination)
    setApiSortOrderParam(url, sortOrder)
    if (sortBy) url.searchParams.append('sortBy', sortBy)

    const r = await fetch(url, {
      headers: {
        ...(await getAuthHeader()),
      },
    })
    return r
  }

  type GetConfigParams = {
    configId: number
  }
  const getConfig = async ({ configId }: GetConfigParams) => {
    const r = await fetch(`${envUrl.value}/configs/${configId}`, {
      headers: {
        ...(await getAuthHeader()),
        'Content-Type': 'application/json',
      },
    })
    return r
  }

  type PostConfigParams = {
    name: string
    description?: string
    fetchInit?: RequestInit
  }
  /** Step 3.2 */
  const postConfig = async ({
    name,
    description,
    fetchInit,
  }: PostConfigParams) => {
    const r = await fetch(`${envUrl.value}/configs`, {
      method: 'POST',
      headers: {
        ...(await getAuthHeader()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
      ...fetchInit,
    })
    return r
  }

  type PatchConfigParams = {
    configId: number
    name: string
    description: string
  }
  const patchConfig = async ({
    configId,
    name,
    description,
  }: PatchConfigParams) => {
    const r = await fetch(`${envUrl.value}/configs/${configId}`, {
      method: 'PATCH',
      headers: {
        ...(await getAuthHeader()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    })
    return r
  }

  type DeleteConfigParams = {
    configId: number
  }
  const deleteConfig = async ({ configId }: DeleteConfigParams) => {
    const r = await fetch(`${envUrl.value}/configs/${configId}`, {
      method: 'DELETE',
      headers: {
        ...(await getAuthHeader()),
      },
    })
    return r
  }

  // =================
  //  Configs in file
  // =================
  type GetFileCollectionEndpointParams = {
    configId: number
  }
  const getFileCollectionEndpoint = ({
    configId,
  }: GetFileCollectionEndpointParams) =>
    `${envUrl.value}/configs/${configId}/files`

  type GetFileInConfigEndpoint = {
    configId: number
    filename: string
  }
  /**
   * the filename needs to be escaped two times to be accepted by the API.
   */
  const getFileEndpoint = ({ configId, filename }: GetFileInConfigEndpoint) =>
    `${getFileCollectionEndpoint({ configId })}/${encodeURIComponent(encodeURIComponent(filename))}`

  type PatchFileInConfigParams = {
    configId: number
    content: File
    filename: string
  }
  const patchFileInConfig = async ({
    configId,
    content,
    filename,
  }: PatchFileInConfigParams) => {
    const body = new FormData()
    body.append('content', content)
    const r = await fetch(getFileEndpoint({ configId, filename }), {
      method: 'PATCH',
      headers: {
        ...(await getAuthHeader()),
      },
      body,
    })
    return r
  }

  type PostFileInConfigParams = {
    configId: number
    content: File
    filename: string
  }
  const postFileInConfig = async ({
    configId,
    content,
    filename,
  }: PostFileInConfigParams) => {
    const body = new FormData()
    body.append('content', content)
    body.append('filename', encodeURIComponent(filename))
    try {
      const r = await fetch(getFileCollectionEndpoint({ configId }), {
        method: 'POST',
        headers: {
          ...(await getAuthHeader()),
        },
        body,
      })
      return r
    } catch (err) {
      console.error('Error: ', err)
    }
  }

  type DeleteFileInConfigParams = {
    configId: number
    filename: string
  }
  const deleteFileInConfig = async ({
    configId,
    filename,
  }: DeleteFileInConfigParams) => {
    const r = await fetch(getFileEndpoint({ configId, filename }), {
      method: 'DELETE',
      headers: {
        ...(await getAuthHeader()),
      },
    })
    return r
  }

  // =========================
  //  Config creation related
  // =========================
  type initConfigFromExcelParams = {
    configId: string | number
    xlsx: File
    configFile: File
  }
  /** Step 3.3 */
  const initConfigFromExcel = async ({
    configId,
    configFile,
    xlsx,
  }: initConfigFromExcelParams) => {
    const body = new FormData()
    body.append('xlsx', xlsx)
    body.append('config', configFile)
    const r = await fetch(
      `${envUrl.value}/configs/${configId}/config-from-excel`,
      {
        method: 'PATCH',
        headers: {
          ...(await getAuthHeader()),
        },
        body,
      },
    )
    return r
  }

  // =========================
  //  Download file from URL
  // =========================
  /** Step 4 */
  type DownloadProtectedFileParams = {
    url: string
    filename: string
  }
  const downloadProtectedFileOrError = async ({
    url,
    filename,
  }: DownloadProtectedFileParams) => {
    try {
      const r = await fetch(url, {
        headers: {
          ...(await getAuthHeader()),
          Accept: '*/*',
        },
      })
      if (!r.ok) return ((await r.json()) as ApiError).message
      const content = await r.blob()
      const anchor = document.createElement('a')
      document.body.appendChild(anchor)

      const objectUrl = window.URL.createObjectURL(content)

      anchor.href = objectUrl
      anchor.download = filename
      anchor.click()

      window.URL.revokeObjectURL(objectUrl)
      anchor.remove()
    } catch (networkError) {
      return useApiNetworkError()
    }
  }

  /** Download evidence file. Wrapper around downloadProtectedFile */
  const downloadEvidenceFile = async ({ runId }: { runId: number }) =>
    downloadProtectedFileOrError({
      url: `${envUrl.value}/runs/${runId}/evidences`,
      filename: `run-${runId}-evidences.zip`,
    })

  type GetFileContentParams = {
    url: string
  }
  const getFileContent = async ({
    url,
  }: GetFileContentParams): Promise<never | string> => {
    const r = await fetch(encodeURI(url), {
      headers: {
        ...(await getAuthHeader()),
        Accept: '*/*',
      },
    })
    if (!r.ok) {
      throw new Error(await r.text())
    }
    return await r.text()
  }

  // =========================
  //  Copy/Duplicate Config
  // =========================
  type CopyConfigParams = {
    configId: number
    payload: {
      name: string
      description?: string
    }
  }
  const copyConfig = async ({
    configId,
    payload,
  }: CopyConfigParams): Promise<any> => {
    return await fetch(`${envUrl.value}/configs/${configId}/copy`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  }

  // ======
  //  Runs
  // ======
  // TODO: add sortBy and also in wrapper functions
  type GetRunsParams = PaginationParam &
    SortOrderParam & {
      filter?: {
        configIds?: number[]
        latestRunOnly?: boolean
      }
    }
  const getRuns = async ({
    pagination,
    filter,
    sortOrder,
  }: GetRunsParams = {}) => {
    const url = new URL(`${envUrl.value}/runs`)
    setApiPaginationParams(url, pagination)
    setApiSortOrderParam(url, sortOrder ?? 'DESC')
    if (filter?.configIds) {
      url.searchParams.append('filter', `config=${filter.configIds.join(',')}`)
    }
    if (filter?.latestRunOnly) {
      url.searchParams.append('filter', 'latestOnly=true')
    }

    const r = await fetch(url, {
      headers: {
        ...(await getAuthHeader()),
      },
    })

    return r
  }

  type GetLastRunOfConfigsParams = PaginationParam &
    SortOrderParam & { filter?: { configIds: number[] } }
  /** Retrieve the last run of each configuration provided */
  const getLastRunOfConfigs = async ({
    pagination,
    sortOrder,
    filter,
  }: GetLastRunOfConfigsParams) =>
    getRuns({
      pagination,
      sortOrder,
      filter: { ...filter, latestRunOnly: true },
    })

  type GetLastRunsParams = PaginationParam &
    SortOrderParam & { filter: { configId: number } }
  /** Retrieve all the runs of the specified configuration */
  const getRunsOfConfig = async ({ pagination, filter }: GetLastRunsParams) =>
    getRuns({
      pagination,
      sortOrder: 'DESC',
      filter: { configIds: [filter.configId] },
    })

  type GetRunParams = {
    runId: number
  }
  const getRun = async ({ runId }: GetRunParams) => {
    const r = await fetch(`${envUrl.value}/runs/${runId}`, {
      headers: {
        ...(await getAuthHeader()),
        'Content-Type': 'application/json',
      },
    })
    return r
  }

  type PostRunParams = {
    configId: number
  }
  const postRun = async ({ configId }: PostRunParams) => {
    const r = await fetch(`${envUrl.value}/runs/`, {
      method: 'POST',
      headers: {
        ...(await getAuthHeader()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ configId }),
    })
    return r
  }

  type PostRunCheck = {
    configId: number
    environment?: Record<string, string>
    singleCheck: SingleCheck
  }
  const postRunCheck = async (payload: PostRunCheck) => {
    const r = await fetch(`${envUrl.value}/runs`, {
      method: 'POST',
      headers: {
        ...(await getAuthHeader()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    return r
  }

  type DeleteRunParams = {
    runId: number
  }
  const deleteRun = async ({ runId }: DeleteRunParams) => {
    const r = await fetch(`${envUrl.value}/runs/${runId}`, {
      method: 'DELETE',
      headers: {
        ...(await getAuthHeader()),
      },
    })
    return r
  }

  type GetResultsParams = {
    runId: number
  }
  const getRunResults = async ({ runId }: GetResultsParams) => {
    return fetch(`${envUrl.value}/runs/${runId}/results`, {
      headers: {
        ...(await getAuthHeader()),
      },
    })
  }

  type GetEvidencesParams = {
    runId: number
  }
  const getEvidences = async ({ runId }: GetEvidencesParams) => {
    const r = await fetch(`${envUrl.value}/runs/${runId}/evidences`, {
      headers: {
        ...(await getAuthHeader()),
      },
    })
    if (!r.ok) {
      return
    }
    return await r.text()
  }

  type GetNamespaceUsersParams = PaginationRequestParams & {
    sortOrder?: 'ASC' | 'DESC'
    sortBy?: string
  }

  const getNamespaceUsers = async ({
    sortOrder,
    sortBy,
    items = '100',
    page,
  }: GetNamespaceUsersParams = {}) => {
    const url = new URL(
      `${baseApiUrl.value}/namespaces/${currentNamespace.value?.id}/users`,
    )
    setApiPaginationParams(url, { items, page })
    setApiSortOrderParam(url, sortOrder)
    if (sortBy) url.searchParams.append('sortBy', sortBy)

    const r = await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    })
    return r
  }

  const getAutopilotExplanation = async ({
    runId,
    chapter,
    requirement,
    check,
  }: GetAutoPilotExplanationParams) => {
    const url = new URL(`${envUrl.value}/explainer`)
    url.searchParams.append('runId', runId)
    url.searchParams.append('chapter', chapter)
    url.searchParams.append('requirement', requirement)
    url.searchParams.append('check', check)
    return await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    })
  }

  return {
    getNamespaces,
    getSecrets,
    postSecret,
    patchSecret,
    deleteSecret,
    getConfigs,
    getConfig,
    postConfig,
    patchConfig,
    deleteConfig,
    postFileInConfig,
    getFileCollectionEndpoint,
    patchFileInConfig,
    deleteFileInConfig,
    copyConfig,
    getRuns,
    getRunsOfConfig,
    getLastRunOfConfigs,
    getRun,
    postRun,
    postRunCheck,
    deleteRun,
    getRunResults,
    getEvidences,
    initConfigFromExcel,
    downloadProtectedFileOrError,
    downloadEvidenceFile,
    getFileContent,
    getNamespaceUsers,
    getAutopilotExplanation,
  }
}
