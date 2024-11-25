// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type BitbucketPr = {
  id: number
  state: string
  /** Milliseconds since unix epoch of the last update to this pull request */
  updatedDate: number
  [s: string]: unknown
}
