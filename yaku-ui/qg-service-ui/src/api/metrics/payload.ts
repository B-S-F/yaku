// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { SortOrder } from '../common'
import type { FindingMetric } from './entities'

export type PaginationParams = {
  items?: number
  page?: number
}

export type SortParams = {
  sortBy?: keyof FindingMetric
  sortOrder?: SortOrder
}

export type BaseParams = PaginationParams & SortParams
