// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { BitbucketPr } from '../../../src/model/bitbucket-pr'
import { BitbucketResponse } from '../../../src/model/bitbucket-response'

export const singlePageResponse: BitbucketResponse<BitbucketPr> = {
  isLastPage: true,
  limit: 25,
  size: 2,
  start: 0,
  values: [
    {
      id: 1,
      updatedDate: 123456,
      state: 'OPEN',
    },
    {
      id: 2,
      updatedDate: 123456,
      state: 'OPEN',
    },
  ],
}

export const multiPageResponse: BitbucketResponse<BitbucketPr>[] = [
  {
    nextPageStart: 2,
    isLastPage: false,
    limit: 2,
    size: 2,
    start: 0,
    values: [
      {
        id: 1,
        updatedDate: 123456,
        state: 'OPEN',
      },
      {
        id: 2,
        updatedDate: 123456,
        state: 'OPEN',
      },
    ],
  },
  {
    isLastPage: true,
    limit: 2,
    size: 2,
    start: 2,
    values: [
      {
        id: 3,
        updatedDate: 123456,
        state: 'OPEN',
      },
      {
        id: 4,
        updatedDate: 123456,
        state: 'OPEN',
      },
    ],
  },
]
