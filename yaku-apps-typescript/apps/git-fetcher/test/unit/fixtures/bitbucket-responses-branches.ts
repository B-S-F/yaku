import { BitbucketBranch } from '../../../src/model/bitbucket-branch'
import { BitBucketResponse } from '../../../src/model/BitBucketResponse'
import { BitbucketTag } from '../../../src/model/bitbucket-tag'

export const bitBucketBranchEmptyResponse: BitBucketResponse<BitbucketTag> = {
  size: 0,
  limit: 25,
  start: 0,
  isLastPage: true,
  values: [],
}

export const bitBucketBranchSinglePageResponse: BitBucketResponse<BitbucketBranch> =
  {
    size: 1,
    limit: 25,
    start: 0,
    isLastPage: true,
    values: [
      {
        id: 'refs/heads/main',
        displayId: 'main',
        type: 'BRANCH',
        latestCommit: 'b2e71587157e15201589790ee1c8a17455b967aa',
        latestChangeset: 'b2e71587157e15201589790ee1c8a17455b967aa',
        isDefault: true,
      },
    ],
  }

export const bitBucketBranchMultiPageResponse: BitBucketResponse<BitbucketBranch>[] =
  [
    {
      size: 2,
      limit: 2,
      start: 0,
      nextPageStart: 2,
      isLastPage: false,
      values: [
        {
          id: 'refs/heads/main',
          displayId: 'main',
          type: 'BRANCH',
          latestCommit: 'b2e71587157e15201589790ee1c8a17455b967aa',
          latestChangeset: 'b2e71587157e15201589790ee1c8a17455b967aa',
          isDefault: true,
        },
        {
          id: 'refs/heads/AQUATEST-5-update-jira-evaluator-1',
          displayId: 'AQUATEST-5-update-jira-evaluator-1',
          type: 'BRANCH',
          latestCommit: 'e386f3482f18d174d3478164d9217025d86d0655',
          latestChangeset: 'e386f3482f18d174d3478164d9217025d86d0655',
          isDefault: false,
        },
      ],
    },
    {
      size: 2,
      limit: 2,
      start: 2,
      isLastPage: true,
      values: [
        {
          id: 'refs/heads/test-branch-31-01',
          displayId: 'test-branch-31-01',
          type: 'BRANCH',
          latestCommit: '68521d211c5e38c27381718149014c5ec20b1f8e',
          latestChangeset: '68521d211c5e38c27381718149014c5ec20b1f8e',
          isDefault: false,
        },
        {
          id: 'refs/heads/test-branch-1',
          displayId: 'test-branch-1',
          type: 'BRANCH',
          latestCommit: '539328a0427477d38c06a336a3b1f908238c1b6a',
          latestChangeset: '539328a0427477d38c06a336a3b1f908238c1b6a',
          isDefault: false,
        },
      ],
    },
  ]
