// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { TaskReference, TaskReminder } from '~/types/Task'
import {
  PaginationRequestParams,
  SortOrder,
  SortOrderParam,
} from '../common/payload'
import { ReleaseCommentReference } from './comment'

export type ApproveReleaseParams = {
  releaseId: number
  comment?: string
}
export type ResetReleaseParams = {
  releaseId: number
  comment?: string
}
export type AddApproverParams = {
  releaseId: number
  user: string
}

export type GetApprovalStateParams = PaginationRequestParams & {
  releaseId: number
  sortOrder?: SortOrder
}

export type GetReleasesParams = PaginationRequestParams & {
  sortOrder?: SortOrder
}

export type GetApproverStateParams = {
  releaseId: number
  approverId: number
}

export type RemoveApproverParams = {
  releaseId: number
  approverId: number
}

export type NewReleaseApprover = {
  id: string
}
export type CreateReleasePayload = {
  name: string
  approvalMode: 'one' | 'all'
  qgConfigId: number | null
  plannedDate: string
}

export type GetSingleReleaseParams = {
  releaseId: number | string
}

export type PatchReleasePayload = {
  name: string
  plannedDate: string
}
export type PatchReleaseParams = {
  releaseId: number
  payload: PatchReleasePayload
}

export type GetApprovalStateAllParams = PaginationRequestParams & {
  releaseId: number
  sortOrder?: SortOrder
}

export type GetReleaseCommentsParams = PaginationRequestParams & {
  releaseId: number
  sortOrder?: SortOrder
}

export type ReleaseCommentPayload = {
  reference: ReleaseCommentReference
  content: string
  todo: boolean
}
export type AddCommentToReleaseParams = {
  releaseId: number
  comment: ReleaseCommentPayload
}

export type GetCommentsByRefenceParams = {
  releaseId: number
  type: string // 'check', 'comments', ....
  chapterId?: string
  requirementId?: string
  check?: string
  sortOrder?: SortOrder
}

export type CloseReleaseParams = {
  releaseId: number
}

export type GetReleaseHistoryParams = PaginationRequestParams & {
  releaseId: number
  sortOrder?: SortOrder
  filter?: 'check' | 'event' | 'resolved' | 'unresolved' | 'approval'
}

export type GetReleaseOverridesParams = {
  releaseId: number
}

export type AddReleaseOverridesParams = {
  releaseId: number
  chapterId: string
  requirementId: string
  check: string
  comment: string
  manualColor: string
  originalColor: string
}

export type PatchReleaseOverridesParams = {
  comment: string
  manualColor: string
  originalColor: string
}

export type ReleaseSubscriptionOperation = 'subscribe' | 'unsubscribe'

export type ManageReleaseSubscriptionPayload = {
  releaseId: number
  operation: ReleaseSubscriptionOperation
}

export type GetReleaseSubscriptionsParams = {
  userId: string
  releaseId: number
}

/** Tasks */

export type CreateTaskPayload = {
  title?: string
  dueDate: string
  reminder: TaskReminder
  description?: string
}

export type CreateTaskReferenceTaskPayload = {
  dueDate: string
  reminder: TaskReminder
  reference: TaskReference
}

export type GetAllTasksParams = PaginationRequestParams &
  SortOrderParam & {
    sortBy?: 'dueDate' | 'creationTime' | 'lastModificationTime'
    state?: 'open' | 'closed'
    assignees?: string[]
  }

export type GetTaskDetailsParams = {
  taskId: number
}

export type PatchTaskPayload = {
  title?: string
  dueDate: string
  reminder: TaskReminder
  description?: string
}

export type DeleteTaskParams = {
  taskId: number
}

export type CloseTaskParams = {
  taskId: number
}

export type ReopenTaskParams = {
  taskId: number
}

export type AssignTaskPayload = {
  taskId: number
  assignees: string[]
}

export type UnassignTaskPayload = {
  taskId: number
  assignees: string[]
}
