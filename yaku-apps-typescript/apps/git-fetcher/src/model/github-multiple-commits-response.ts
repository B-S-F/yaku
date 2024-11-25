// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type GithubMultipleCommitsResponse = {
  sha: string
  node_id: string
  commit: any
  url: string
  html_url: string
  comments_url: string
  author: any
  committer: any
  parents: Array<any>
}
