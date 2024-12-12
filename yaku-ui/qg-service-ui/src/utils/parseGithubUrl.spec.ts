// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { parseGithubUrl } from './parseGithubUrl'

describe('parseGithubUrl', () => {
  it('returns the elements from a simple link to the repository', () => {
    expect(parseGithubUrl('https://github.com/B-S-F/yaku/')).toStrictEqual({
      ok: true,
      org: 'B-S-F',
      project: 'yaku',
      repositoryUrl: 'https://github.com/B-S-F/yaku/',
    })
  })

  it('returns the elements from a PR', () => {
    expect(
      parseGithubUrl('https://github.com/B-S-F/yaku/pull/71'),
    ).toStrictEqual({
      ok: true,
      org: 'B-S-F',
      project: 'yaku',
      repositoryUrl: 'https://github.com/B-S-F/yaku/',
    })
  })

  it('returns an error if it is not a github link', () => {
    expect(parseGithubUrl('https://example.com/')).toStrictEqual({
      ok: false,
      message: 'The github repository is not recognized from the URL.',
    })
  })
})
