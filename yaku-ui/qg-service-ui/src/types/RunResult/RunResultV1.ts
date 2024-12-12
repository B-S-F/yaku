// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Finding } from '~/types'
import type { BasicHeader, RunResultStatus } from './Common'

type IdUnit = `${number}`

/**
 * Definition: https://github.com/B-S-F/yaku/tree/main/onyx/pkg/result/result.go
 */
export type RunResultV1 = {
  header: BasicHeader & { toolVersion: string }
  metadata: {
    version: 'v1'
  }
  overallStatus: RunResultStatus
  chapters: Record<IdUnit, Chapter>
  statistics: Statistics
  finalize: {
    execution: ExecutionInformation
  }
}

export type Chapter = {
  title: string
  text?: string
  requirements: Record<IdUnit, RequirementResult>
  status: RunResultStatus
}

export type RequirementResult = {
  title: string
  text: string
  status: RunResultStatus
  checks?: Record<string, CheckResult>
}

export type ResultType = 'Manual' | 'Automation'

export type CheckResult = {
  title: string
  status: string
  type: ResultType
  evaluation: Evaluation
}

export type Evaluation = {
  status: RunResultStatus
  reason?: string
  autopilot?: string
  execution?: ExecutionInformation
  /** Findings of the check, if any */
  results?: Result[]
  outputs?: Record<string, string>
}

export type Result = {
  criterion: string
  fulfilled: boolean
  justification: string
  metadata?: ResultMetadata
}

export type ResultMetadata = {
  customer?: string
  package?: string
  severity?: Finding['metadata']['severity']
} & Record<string, string>

export type ExecutionInformation = {
  logs?: string[]
  errorLogs?: string[]
  evidencePath: string
  exitCode: number
}

export type Statistics = {
  'counted-checks': number
  'counted-automated-checks': number
  'counted-manual-check': number
  'counted-unanswered-checks': number
  'degree-of-automation': number
  'degree-of-completion': number
}
