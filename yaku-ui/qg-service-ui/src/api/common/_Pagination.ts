// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type Pagination<T> = {
  pagination: {
    pageNumber: number
    pageSize: number
    totalCount: number
  }
  data: T[]
  links: {
    prev?: string
    next?: string
    last: string
    first: string
  }
}
