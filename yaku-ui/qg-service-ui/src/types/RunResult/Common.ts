// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { OverallResult } from '~/types'

export type BasicHeader = {
  name: string
  version: string
  date: string
}

export type RunResultStatus = OverallResult | 'NA' | 'SKIPPED'
export type ManualStatus = Exclude<
  RunResultStatus,
  'PENDING' | 'RUNNING' | 'ERROR'
>
