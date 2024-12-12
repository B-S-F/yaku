// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { LocationQueryRaw, RouteLocationRaw } from 'vue-router'
import type { ResultType, RunResultStatus } from '~/types/RunResult'
import { ManualStatus } from '~/types/RunResult/Common'
import { OverallResult } from '.'

export type { RunResultStatus }

/**
 * A run report is a conversion of a run result that matches the UI requirements.
 * As such any run result can be converted to a run report.
 */
export type RunReport = {
  header: {
    name: string
    date: string
    version: string
  }
  metadata: {
    version: 'v0' | 'v1'
  }
  overallStatus: RunResultStatus
  sections: ReportSection[]
}

export type ReportSection = {
  id: string
  title: string
  checks: ReportCheck[]
}

export type ReportCheck = {
  id: string
  title: string
  status: RunResultStatus
  manualEvaluation?: ManualEvaluation // v0
  results: ReportResult[]
}

export type ReportResult = {
  id: string
  title: string
  name: string
  type?: ResultType // v1
  status: RunResultStatus
  reason?: string // v1
  comments?: string[]
  manualEvaluation?: ManualEvaluation // v1
  evidencePath?: string
}

/** A manual status set. It can be found at many places of a run results, so it is in the run report.  */
export type ManualEvaluation = {
  status: ManualStatus | undefined
  reason: string | undefined
}

export type ContentNavigationRouterLink = RouteLocationRaw & {
  query: { content: NonNullable<LocationQueryRaw[string | number]> }
}

export type RunReportNavBaseProps = {
  id: string
  color?: OverallResult | string
  name: string
  to?: ContentNavigationRouterLink
}

export type RunReportNavCheckProps = RunReportNavBaseProps

export type RunReportNavRequirementProps = RunReportNavBaseProps & {
  checks: RunReportNavCheckProps[]
}

export type RunReportNavChapterProps = RunReportNavBaseProps & {
  hasOverride?: boolean
  requirements: RunReportNavRequirementProps[]
}
