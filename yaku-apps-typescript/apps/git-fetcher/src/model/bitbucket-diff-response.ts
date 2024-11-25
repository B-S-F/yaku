// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type BitbucketDiffResponse = {
  fromHash: string
  toHash: string
  contextLines: number
  whitespace: string
  diffs: any
  truncated: boolean
}
