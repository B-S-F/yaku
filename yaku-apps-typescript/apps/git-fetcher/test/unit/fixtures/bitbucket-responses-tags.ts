import { BitBucketResponse } from '../../../src/model/BitBucketResponse'
import { BitbucketTag } from '../../../src/model/bitbucket-tag'

export const bitBucketTagEmptyResponse: BitBucketResponse<BitbucketTag> = {
  size: 0,
  limit: 25,
  start: 0,
  isLastPage: true,
  values: [],
}

export const bitBucketTagSinglePageResponse: BitBucketResponse<BitbucketTag> = {
  size: 1,
  limit: 25,
  start: 0,
  isLastPage: true,
  values: [
    {
      id: 'refs/tags/initial',
      displayId: 'initial',
      type: 'TAG',
      latestCommit: '9da28cfda7344149d18e36b69279565373a8dfb9',
      latestChangeset: '9da28cfda7344149d18e36b69279565373a8dfb9',
      hash: 'a13dbf0d42971adfc592103941cc7898652f3cbb',
    },
  ],
}

export const bitBucketTagMultiPageResponse: BitBucketResponse<BitbucketTag>[] =
  [
    {
      size: 1,
      limit: 1,
      start: 0,
      isLastPage: false,
      nextPageStart: 1,
      values: [
        {
          id: 'refs/tags/initial',
          displayId: 'initial',
          type: 'TAG',
          latestCommit: '9da28cfda7344149d18e36b69279565373a8dfb9',
          latestChangeset: '9da28cfda7344149d18e36b69279565373a8dfb9',
          hash: 'a13dbf0d42971adfc592103941cc7898652f3cbb',
        },
      ],
    },
    {
      size: 1,
      limit: 1,
      start: 1,
      isLastPage: true,
      values: [
        {
          id: 'refs/tags/tag-for-readme',
          displayId: 'tag-for-readme',
          type: 'TAG',
          latestCommit: '68521d211c5e38c27381718149014c5ec20b1f8e',
          latestChangeset: '68521d211c5e38c27381718149014c5ec20b1f8e',
          hash: 'd1994e10bd134e7b1cf25213d3efcb0004226e6f',
        },
      ],
    },
  ]
