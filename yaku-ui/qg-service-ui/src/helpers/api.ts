// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Pagination } from '~/api/common/_Pagination'

export const getApiPageAmount = (
  pagination: Pagination<unknown>['pagination'],
): number =>
  Math.ceil(pagination?.totalCount ?? 0 / Math.max(1, pagination.pageSize))
