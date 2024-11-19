// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { GithubLabel } from './github-label'

export type GithubPr = {
  /** Uniquely identifies a pull request */
  number: number
  state: string
  labels: GithubLabel[]
  [s: string]: unknown
}
