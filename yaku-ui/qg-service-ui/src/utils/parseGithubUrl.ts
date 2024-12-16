// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

type ParseGithubUrlReturnValue =
  | {
      ok: false
      message: string
    }
  | {
      ok: true
      org: string
      project: string
      repositoryUrl: string
    }

export const parseGithubUrl = (link: string): ParseGithubUrlReturnValue => {
  const url = new URL(link)
  if (url.hostname !== 'github.com')
    return {
      ok: false,
      message: 'The github repository is not recognized from the URL.',
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, org, project] = url.pathname.split('/')
  const repositoryUrl = `${url.origin}/${org}/${project}`

  return {
    ok: true,
    org,
    project,
    repositoryUrl,
  }
}
