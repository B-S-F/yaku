// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { NETWORK_ERROR_MSG } from '~/composables/api/useApiNetworkError'
import { provideRequestError } from '~/helpers'

/**
 * This file should be limited to the /store scope
 */

export type OperationSuccess<T> = { ok: true; resource: T }
export type OperationFailed = {
  ok: false
  resource: undefined
  error: { status: number; msg: string } | NetworkError
}

export type OperationResult<T> = OperationSuccess<T> | OperationFailed
/** a specific type of error that does not return an HTTP status */
export type NetworkError = { status: undefined; msg: string; raw: unknown }

export const getNetworkError = (e: unknown): OperationFailed =>
  ({
    ok: false,
    resource: undefined,
    error: { status: undefined, msg: NETWORK_ERROR_MSG, raw: e },
  }) as const

type GetApiErrorOpts = {
  /** Map a specific status type to a response */
  customErrMsg?: Record<number, string>
}
export const getApiError = async (
  r: Response,
  { customErrMsg = {} }: GetApiErrorOpts = {},
): Promise<OperationFailed> => ({
  ok: false,
  resource: undefined,
  error: {
    status: r.status,
    msg: customErrMsg[r.status] ?? (await provideRequestError(r)),
  },
})
