// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { RunResultStatus } from './Common'

type IdUnit = `${number}`

/**
 * Deep of the Run Report Allocations:
 * ```
 * "allocations":
 *   'number':
 *     - requirements:
 *        'number.number':
 *          - checks:
 *            - report:
 *              - componentResults
 * ```
 */
export type RunResultV0 = {
  /** V0 does not have a metadata field. It allows to distinguish it in the UI. */
  metadata?: undefined
  header: {
    name: string
    version: string
    date: string
    qgCliVersion: string
  }
  overallStatus: RunResultStatus
  allocations: { [key: IdUnit]: Allocation }
}

export type Allocation = {
  id: IdUnit
  title: string
  status: RunResultStatus
  requirements: {
    [key: `${IdUnit}.${IdUnit}`]: Requirement
  }
}

export type Requirement = {
  id: `${IdUnit}.${IdUnit}`
  title: string
  text: string
  checks: { [key: IdUnit]: Check }
  status: RunResultStatus
  manualStatus?: RunResultStatus
  reason?: string
}

export type Check = {
  id: IdUnit
  title: string
  reports: CheckReport[]
}

export type CheckReport = {
  reportType: string
  componentResults: [ComponentResultReport]
}

export type ComponentResultReport = {
  component: {
    id: string
    version: `${IdUnit}.${IdUnit}.${IdUnit}`
  }
  evidencePath: string
  status: RunResultStatus
  comments: string[] | undefined
  sources: Array<{ [key: string]: string }>
  logs?: { stdout: string; stderr: string; exitCode: number }
}
