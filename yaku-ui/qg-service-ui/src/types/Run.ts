// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type OverallResult =
  | 'GREEN'
  | 'YELLOW'
  | 'RED'
  | 'PENDING'
  | 'UNANSWERED'
  | 'FAILED'
  | 'ERROR'
  | 'NA'

type BaseRun = {
  id: number
  config: string
  creationTime: string
  log?: string[]
}

export type RunUnaccomplished = BaseRun & {
  status: 'pending' | 'running' | 'failed'
  overallResult: undefined
  completionTime: undefined
}

export type RunCompleted = BaseRun & {
  status: 'completed'
  overallResult: OverallResult
  completionTime: string
}

export type Run = RunCompleted | RunUnaccomplished
export type LocalRun = Run & { configId: number }

export type RunStateUnaccomplished = Pick<
  RunUnaccomplished,
  'status' | 'overallResult'
>
export type RunStateCompleted = Pick<RunCompleted, 'status' | 'overallResult'>
export type RunState = RunStateUnaccomplished | RunStateCompleted
