// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Router } from 'vue-router'

export const NETWORK_ERROR_MSG =
  'The server does not respond. Please try again later.'

type UseApiNetworkErrorParams = {
  redirectWithRouter?: Router
}
/** In case the server does not respond. */
export const useApiNetworkError = ({
  redirectWithRouter,
}: UseApiNetworkErrorParams = {}) => {
  if (redirectWithRouter) {
    redirectWithRouter.push({ name: 'NetworkError' })
  } else {
    return NETWORK_ERROR_MSG
  }
}
