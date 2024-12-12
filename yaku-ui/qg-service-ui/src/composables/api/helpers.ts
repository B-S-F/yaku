// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { PaginationRequestParams, SortOrder } from '~/api/common'

export const DEFAULT_ITEMS_PER_PAGE = 20

/**
 * Add the expected parameters in place.
 * Note that it can only be used in ApiCore at the moment
 */
export const setApiPaginationParams = (
  url: URL,
  { page, items }: PaginationRequestParams = {},
) => {
  if (page) url.searchParams.append('page', page)
  if (items) url.searchParams.append('items', items)
  return url
}

/**
 * Add the expected parameters in place.
 * Note that it can only be used in ApiCore at the moment
 */
export const setApiSortOrderParam = (url: URL, sortOrder?: SortOrder) => {
  if (sortOrder) url.searchParams.append('sortOrder', sortOrder)
  return url
}
