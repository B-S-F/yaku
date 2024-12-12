// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { PaginationParam, SortOrderParam } from '~/api/common'

/** the properties referenced are the ones of the documentation https://yaku-dev.bswf.tech/docs#/Findings/FindingController_getAllFindingsInNamespace  */
type SortBy =
  | 'id'
  | 'configId'
  | 'runId'
  | 'runStatus'
  | 'runCompletionTime'
  | 'occurrenceCount'
  | 'status'
  | 'resolvedDate'
  | 'resolver'
  | 'createdAt'
  | 'updatedAt'

export type GetFindingsParams = PaginationParam &
  SortOrderParam & {
    sortBy?: SortBy
    filters?: {
      id?: string
      runId?: string
      configId?: string
      search?: string
      hideResolved?: boolean
    }
  }
