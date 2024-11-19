// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ConfigurationError } from '../run.js'

export function handleResponseStatus(statusCode: number) {
  if (statusCode == 404) {
    throw new ConfigurationError(
      `Repository not found. Status code: ${statusCode}`
    )
  } else if (statusCode == 401 || statusCode == 403) {
    if ((process.env.GIT_FETCHER_SERVER_TYPE as string) === 'github') {
      throw new ConfigurationError(
        `Could not access the required repository, SSO Token might not be authorized for the required organization. Status code: ${statusCode}`
      )
    }
    throw new ConfigurationError(
      `Could not access the required repository. Status code: ${statusCode}`
    )
  } else {
    throw new Error(
      `Could not fetch data from git repository. Status code: ${statusCode}`
    )
  }
}
