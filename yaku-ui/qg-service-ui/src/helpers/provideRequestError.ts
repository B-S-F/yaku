// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { ApiError } from '~/api'

const getRateLimit = ({ headers }: Response) => ({
  limit: headers.get('ratelimit-limit'),
  remaining: headers.get('ratelimit-remaining'),
  reset: headers.get('ratelimit-reset'),
})

/**
 * The function returns different error messages depending on the HTTP status error.
 * It is originally meant for the rate limiting, but it can be extended to whatever the needs are.
 * Note that this is a way to provide custom error messages that overwrites the one of the APIs.
 *
 */
export const provideRequestError = async (r?: Response | undefined) => {
  if (r?.status === 429) {
    const { limit, reset } = getRateLimit(r)
    if (limit === null || reset === null) {
      return `You reached the rate limit. Please try again in a minute by refreshing your browser window, or contact an admin of the namespace if this blocks your use of the interface.`
    }
    return `You reached the rate limit of ${limit} number of requests. Please try again in ${reset} seconds by refreshing your browser window.`
  }

  return (
    ((await r?.json()) as ApiError)?.message ??
    'An unknown error occured during your action.'
  )
}
