// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type BitbucketResponse<T> = {
  size: number
  limit: number
  isLastPage: boolean
  start: number
  values: T[]
  [s: string]: unknown
  nextPageStart?: number | null
}
