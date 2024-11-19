// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type BitbucketBranch = {
  id: string
  displayId: string
  type: 'BRANCH'
  latestCommit: string
  latestChangeset: string
  isDefault: boolean
}
