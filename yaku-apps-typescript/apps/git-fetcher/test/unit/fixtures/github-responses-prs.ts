// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { GithubLabel } from '../../../src/model/github-label'
import { GithubPr } from '../../../src/model/github-pr'

const gitHubLabel: GithubLabel = {
  id: 1,
  name: 'foo',
}

const gitHubPrResponse1: GithubPr = {
  number: 1,
  state: 'open',
  labels: [gitHubLabel],
}

const gitHubPrResponse2: GithubPr = {
  number: 2,
  state: 'closed',
  labels: [gitHubLabel],
}

const gitHubPrResponse3: GithubPr = {
  number: 3,
  state: 'open',
  labels: [gitHubLabel],
}

const gitHubPrResponse4: GithubPr = {
  number: 4,
  state: 'closed',
  labels: [gitHubLabel],
}

const singleResponse1: GithubPr[] = [gitHubPrResponse1, gitHubPrResponse2]
const singleResponse2: GithubPr[] = [gitHubPrResponse3, gitHubPrResponse4]

export const multiPageResponse: GithubPr[][] = [
  singleResponse1,
  singleResponse2,
  [],
]
