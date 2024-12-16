// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { NamespaceUser, ReleaseComment, SingleCheck } from '~/api'
import { Evaluation, ResultType } from './RunResult'
import type { Badge } from '~/types/StatusPillDisplay'
import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router'

export type Release = {
  id: number
  name: string
  plannedDate: string
  qgConfigId: number
  createdBy: string
  approvalState: 'approved' | 'pending'
  approvalMode: 'one' | 'all'
  closed: boolean
  lastRunId: number
}

export type ReleaseApprovalState = 'approved' | 'pending'

export type ReleaseApprover = {
  id: number
  user: NamespaceUser
  state: string // 'approved' | 'declined' TODO: update with a definite type once defined
}

export type Check = {
  requirementId: string
  chapterId: string
  title: string
  status: string
  type: ResultType
  evaluation: Evaluation
  id: string
  pageId: string
  originalStatus: string
}

export enum CheckColor {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
  ERROR = 'ERROR',
  FAILED = 'FAILED',
  UNANSWERED = 'UNANSWERED',
  NA = 'NA',
  PENDING = 'PENDING',
}

export type ReleaseHistoryFilter =
  | 'check'
  | 'event'
  | 'resolved'
  | 'unresolved'
  | 'approval'
export type ReleaseHistoryEventObject = {
  actor: NamespaceUser
  action: string
  comment?: ReleaseComment
  newManualColor?: CheckColor
  previousAutoColor?: CheckColor
  previousManualColor?: CheckColor
  reference?: SingleCheck
}
export type ReleaseHistoryItem = {
  type: string
  data: ReleaseHistoryEventObject | ReleaseComment
  timestamp: string
}

export type ContentNavigationRouterLink = RouteLocationRaw & {
  query: { content: NonNullable<LocationQueryRaw[string | number]> }
}

export type ContentItem = {
  badge?: Badge
  id: string
  name: string
  to: ContentNavigationRouterLink
  pageId?: string
}

export type Requirement = ContentItem & {
  checks: ContentItem[]
}
