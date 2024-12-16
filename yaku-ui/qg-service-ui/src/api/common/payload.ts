// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

// ---------
//  Helpers
// ---------
export type PaginationRequestParams = {
  items?: string
  page?: string
}

export type PaginationParam = {
  pagination?: PaginationRequestParams
}

export type SortOrder = 'ASC' | 'DESC'

export type SortOrderParam = {
  sortOrder?: SortOrder
}
