// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { currentEnv, currentNamespace } from './context'
import { computed } from 'vue'
import { useAuthHeaders } from './useAuthHeaders'
import { setApiPaginationParams, setApiSortOrderParam } from './helpers'
import {
  AddApproverParams,
  AddCommentToReleaseParams,
  ApproveReleaseParams,
  CreateReleasePayload,
  GetApprovalStateAllParams,
  GetApprovalStateParams,
  GetApproverStateParams,
  GetCommentsByRefenceParams,
  GetReleaseCommentsParams,
  GetReleasesParams,
  GetSingleReleaseParams,
  PatchReleasePayload,
  RemoveApproverParams,
  ResetReleaseParams,
  CloseReleaseParams,
  GetReleaseHistoryParams,
  GetReleaseOverridesParams,
  AddReleaseOverridesParams,
  PatchReleaseOverridesParams,
  ManageReleaseSubscriptionPayload,
  GetReleaseSubscriptionsParams,
} from '~/api'

const baseApiUrl = computed(() => `${currentEnv.value?.url}/api/v1/namespaces`)

export const useApiReleases = () => {
  const { getAuthHeader } = useAuthHeaders()
  const apiUrl = computed(
    () => `${baseApiUrl.value}/${currentNamespace.value?.id}/releases`,
  )

  /** Get Releases */
  /**
   * Get approval state for all the release approvers
   * @param GetReleasesParams
   * @returns Promise<Response>
   */
  const getReleases = async ({
    items,
    page,
    sortOrder,
  }: GetReleasesParams = {}) => {
    const url = new URL(`${apiUrl.value}`)
    setApiPaginationParams(url, { items, page })
    setApiSortOrderParam(url, sortOrder)

    const r = await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    })
    return r
  }

  const getRelease = async ({ releaseId }: GetSingleReleaseParams) =>
    await fetch(`${apiUrl.value}/${releaseId}`, {
      headers: {
        ...getAuthHeader(),
      },
    })

  /** Approve a release */
  const approveRelease = async (params: ApproveReleaseParams) => {
    return await fetch(`${apiUrl.value}/${params.releaseId}/approve`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: params.comment }),
    })
  }

  /** Reset approval */
  const resetApproval = async (params: ResetReleaseParams) => {
    return await fetch(`${apiUrl.value}/${params.releaseId}/reset`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: params.comment }),
    })
  }

  /**
   * Adds an approver to a release
   * @param AddApproverParams
   * @returns Promise<Response>
   */
  const addApproval = async (params: AddApproverParams) => {
    return await fetch(`${apiUrl.value}/${params.releaseId}/approvers`, {
      method: 'POST',
      body: JSON.stringify({
        user: params.user,
      }),
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    })
  }
  /**
   * Get approval state for all the release approvers
   * @param GetApprovalStateParams
   * @returns Promise<Response>
   */
  const getApprovalState = async ({
    items,
    page,
    sortOrder,
    releaseId,
  }: GetApprovalStateParams) => {
    const url = new URL(`${apiUrl.value}/${releaseId}/state`)
    setApiPaginationParams(url, { items, page })
    setApiSortOrderParam(url, sortOrder)

    const r = await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    })
    return r
  }

  const getApproverState = async ({
    releaseId,
    approverId,
  }: GetApproverStateParams) => {
    return await fetch(`${apiUrl.value}/${releaseId}/approvers/${approverId}`, {
      headers: {
        ...getAuthHeader(),
      },
    })
  }

  const removeApprover = async ({
    releaseId,
    approverId,
  }: RemoveApproverParams) => {
    return await fetch(`${apiUrl.value}/${releaseId}/approvers/${approverId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    })
  }

  const createRelease = async (payload: CreateReleasePayload) =>
    await fetch(apiUrl.value, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

  const deleteRelease = async (releaseId: number) =>
    await fetch(`${apiUrl.value}/${releaseId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    })

  /**
   * Patch release
   * @param PatchReleaseParams
   * @returns Promise<Response>
   */
  const patchRelease = async (
    releaseId: number,
    payload: PatchReleasePayload,
  ) =>
    await fetch(`${apiUrl.value}/${releaseId}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

  /**
   * Get approval state of all apporovers
   * @param GetApprovalStateAllParams
   * @returns Promise<GetApprovalStateAllResponse>
   */
  const getApprovalStateAll = async ({
    releaseId,
    items,
    page,
    sortOrder,
  }: GetApprovalStateAllParams) => {
    const url = new URL(`${apiUrl.value}/${releaseId}/approvers`)
    setApiPaginationParams(url, { items, page })
    setApiSortOrderParam(url, sortOrder)

    const r = await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    })
    return r
  }

  /**
   * Close a release
   * @param CloseRelease
   * @returns Promise<CloseReleaseResponse>
   */
  const closeRelease = async ({ releaseId }: CloseReleaseParams) =>
    await fetch(`${apiUrl.value}/${releaseId}/close`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
      },
    })

  // COMMENT SECTION

  /**
   * Get approval state of all apporovers
   * @param GetReleaseCommentsParams
   * @returns Promise<GetReleaseComments>
   */
  const getReleaseComments = async ({
    releaseId,
    items,
    page,
    sortOrder,
  }: GetReleaseCommentsParams) => {
    const url = new URL(`${apiUrl.value}/${releaseId}/comments`)
    setApiPaginationParams(url, { items, page })
    setApiSortOrderParam(url, sortOrder)

    const r = await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    })
    return r
  }

  /**
   * Add comment to the releasse
   * @param AddCommentToReleaseParams
   * @returns Promise<Response>
   */
  const addCommentToRelease = async ({
    releaseId,
    comment,
  }: AddCommentToReleaseParams) => {
    return await fetch(`${apiUrl.value}/${releaseId}/comments`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comment),
    })
  }

  /**
   * Get comments by reference
   */
  const getCommentsByReference = async ({
    releaseId,
    type,
    chapterId,
    requirementId,
    check,
    sortOrder = 'DESC',
  }: GetCommentsByRefenceParams) => {
    const url = new URL(
      `${apiUrl.value}/${releaseId}/comments/get-by-reference`,
    )
    url.searchParams.append('sortOrder', sortOrder)
    return await fetch(url, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        chapter: chapterId,
        requirement: requirementId,
        check,
      }),
    })
  }
  /**
   * Resolve comment
   */

  const resolveReleaseComment = async ({
    releaseId,
    commentId,
  }: { releaseId: number; commentId: number }) => {
    return await fetch(
      `${apiUrl.value}/${releaseId}/comments/${commentId}/resolve`,
      {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    )
  }

  const resetReleaseComment = async ({
    releaseId,
    commentId,
  }: { releaseId: number; commentId: number }) => {
    return await fetch(
      `${apiUrl.value}/${releaseId}/comments/${commentId}/reset`,
      {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    )
  }

  const deleteReleaseComment = async ({
    releaseId,
    commentId,
  }: { releaseId: number; commentId: number }) => {
    return await fetch(`${apiUrl.value}/${releaseId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    })
  }

  /**
   * Get release history
   * @param GetReleaseHistoryParams
   * @returns Promise<GetReleaseHistoryResponse>
   */
  const getReleaseHistory = async ({
    releaseId,
    filter,
    sortOrder,
    items,
    page,
  }: GetReleaseHistoryParams) => {
    const url = new URL(`${apiUrl.value}/${releaseId}/history`)
    setApiPaginationParams(url, { items, page })
    if (filter) {
      url.searchParams.append('filter', filter)
    }
    if (sortOrder) {
      url.searchParams.append('sortOrder', sortOrder)
    }
    const r = await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    })
    return r
  }

  const getReleaseHistoryNext = async (url: string) => {
    return await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    })
  }

  const getReleaseOverride = async ({
    releaseId,
  }: GetReleaseOverridesParams) => {
    const url = new URL(`${apiUrl.value}/${releaseId}/overrides`)
    return await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    })
  }

  const addReleaseOverride = async ({
    releaseId,
    chapterId,
    requirementId,
    check,
    comment,
    manualColor,
    originalColor,
  }: AddReleaseOverridesParams) => {
    return await fetch(`${apiUrl.value}/${releaseId}/overrides`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: {
          chapter: chapterId,
          requirement: requirementId,
          check,
        },
        comment,
        manualColor,
        originalColor,
      }),
    })
  }

  const deleteReleaseOverride = async ({
    releaseId,
    overrideId,
  }: { releaseId: number; overrideId: number }) => {
    return await fetch(`${apiUrl.value}/${releaseId}/overrides/${overrideId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    })
  }

  const patchReleaseOverride = async ({
    releaseId,
    overrideId,
    payload,
  }: {
    releaseId: number
    overrideId: number
    payload: PatchReleaseOverridesParams
  }) => {
    return await fetch(`${apiUrl.value}/${releaseId}/overrides/${overrideId}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  }

  // Release Subscription

  const subscriptionsApi = computed(
    () => `${currentEnv.value?.url}/api/v1/subscriptions`,
  )
  const manageReleaseSubscription = async ({
    releaseId,
    operation,
  }: ManageReleaseSubscriptionPayload) =>
    await fetch(`${subscriptionsApi.value}/manage`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ releaseId, operation }),
    })

  const getReleaseSubscription = async ({
    userId,
    releaseId,
  }: GetReleaseSubscriptionsParams) =>
    await fetch(`${subscriptionsApi.value}/status/${userId}/${releaseId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeader(),
      },
    })
  return {
    addApproval,
    getReleases,
    getRelease,
    approveRelease,
    resetApproval,
    getApprovalState,
    getApproverState,
    removeApprover,
    createRelease,
    deleteRelease,
    patchRelease,
    getApprovalStateAll,
    getReleaseComments,
    addCommentToRelease,
    getCommentsByReference,
    resolveReleaseComment,
    resetReleaseComment,
    deleteReleaseComment,
    closeRelease,
    getReleaseHistory,
    getReleaseHistoryNext,
    getReleaseOverride,
    addReleaseOverride,
    deleteReleaseOverride,
    patchReleaseOverride,
    manageReleaseSubscription,
    getReleaseSubscription,
  }
}
