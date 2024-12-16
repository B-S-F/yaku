// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { NamespaceUser, ReleaseComment, ReleaseOverride } from '~/api'
import { Check, ReleaseApprovalState } from '~/types/Release'
import { Finding } from './Finding'
import { Badge } from './StatusPillDisplay'
import { OverallResult } from './Run'

/** Release Meta details */
export type ReleaseReportReleaseMeta = {
  name: string
  date: string
}

/** Release Config Meta details */
export type ReleaseReportConfigMeta = {
  name: string
  date: string
}

/** Release Config's last run meta details */
export type ReleaseReportRunMeta = {
  id: number
  date: string
}
/** Release Report Run Status Mini Report */
export type ReleaseReportRunStatus = {
  red: number
  yellow: number
  green: number
  na: number
  unanswered: number
  manual: number
  automatic: number
}

/** Release Aggregated Approval status */
export type ReleaseReportApproverStatus = {
  approver: NamespaceUser
  status: ReleaseApprovalState
  comment?: string
}

/** Release report check summary */
export type ReleaseReportCheck = Check & {
  override?: ReleaseOverride
  comments: ReleaseComment[]
  findings: Finding[]
  badge?: Badge
}

/** Report chapter requirement */
export type ReleaseReportChapterRequirement = {
  id: string
  title: string
  badge?: Badge
  checks: ReleaseReportCheck[]
}

/** Release report chapters */
export type ReleaseReportChapter = {
  id: string
  title: string
  badge?: Badge
  requirements: ReleaseReportChapterRequirement[]
}

export type ReportChecksStateSummary = {
  GREEN: number
  RED: number
  YELLOW: number
  NA: number
}

export type ReportCheckAnswersDistribution = {
  automatic: number
  manual: number
  unanswered: number
}

export type ReleaseReport = {
  releaseId?: number
  lastGeneratedOn?: string
  releaseMeta?: ReleaseReportReleaseMeta
  configMeta?: ReleaseReportConfigMeta
  runMeta?: ReleaseReportRunMeta
  checksSummary: ReportChecksStateSummary
  checksAnswersDistribution: ReportCheckAnswersDistribution
  approvers?: ReleaseReportApproverStatus[]
  comments?: ReleaseComment[]
  chapters?: ReleaseReportChapter[]
  overallRunResult?: OverallResult
}

export type ReleaseReportMeta = {
  title: string
  description: string
}

export type checksOverallStatus = {
  GREEN: number
  RED: number
  YELLOW: number
  NA: number
}
