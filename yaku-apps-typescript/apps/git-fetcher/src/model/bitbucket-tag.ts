// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type BitbucketTag = {
  id: string
  displayId: string
  type: 'TAG'
  latestCommit: string
  latestChangeset: string
  hash: string
}
