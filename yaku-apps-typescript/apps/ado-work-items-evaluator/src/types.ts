// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { InvalidIssues, Issue } from '@B-S-F/issue-validators'

type Status = 'GREEN' | 'RED' | 'YELLOW' | 'NA'

export enum CheckReviewsResult {
  noData = 'noData',
  oldLastReview = 'oldLastReview',
}

export interface IFetcherCheckResult {
  outputs: string[]
  status: Status
}

export interface Dictionary {
  [key: string]: any
}

export interface MessageInput {
  fields: Dictionary
  invalidWorkItems: InvalidIssues
  dataCheck?: {
    noData: boolean
    cycleContext: boolean
  }
  relationCheck?: {
    invalidWorkItems: Issue[]
  }
}

export type CheckFieldConfig = {
  fieldName: string
  closedAfterDate?: string
  conditions: {
    expected?: string[]
    resolved?: string[]
    illegal?: string[]
  }
}

export type ChecksConfig = {
  dataExists?: boolean
  cycleInDays?: number
  relationsExists?: boolean
  fields?: { [tag: string]: CheckFieldConfig }
}

export type EvaluateConfig = {
  settings?: {
    dueDateFieldName?: string
    closedStates?: string[]
  }
  checks?: ChecksConfig
}

export type WorkItemsConfig = {
  evaluate?: EvaluateConfig
  children?: {
    evaluate: EvaluateConfig
  }
}

export type Config = {
  workItems: WorkItemsConfig
}
