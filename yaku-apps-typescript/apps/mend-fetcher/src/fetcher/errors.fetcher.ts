// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { AppError, GetLogger } from '@B-S-F/autopilot-utils'
import { AxiosError } from 'axios'

export class UnexpectedDataError extends AppError {
  constructor(reason: string) {
    super(reason)
    this.name = 'UnexpectedDataError'
  }

  Reason(): string {
    return super.Reason()
  }
}

export class RequestError extends AppError {
  constructor(reason: string) {
    super(`RequestError: ${reason}`)
    this.name = 'RequestError'
  }

  Reason(): string {
    return super.Reason()
  }
}

export class ResponseError extends AppError {
  constructor(reason: string) {
    super(reason)
    this.name = 'ResponseError'
  }

  Reason(): string {
    return super.Reason()
  }
}

const processResponseError = (response: any): never => {
  const logger = GetLogger()
  if (!response.data) {
    throw new ResponseError(
      `Response status code ${response.status}: ${response.message}`,
    )
  }
  if (!response.data.retVal) {
    if (response.statusText && response.statusText.length > 0) {
      throw new ResponseError(
        `Response status code ${response.status}: ${response.statusText}`,
      )
    }
    throw new ResponseError(
      `Response status code ${response.status}: ${response.data.error}`,
    )
  }
  if (response.data.supportToken) {
    logger.error(`Mend support token: ${response.data.supportToken}`)
  }
  if (typeof response.data.retVal === 'string') {
    throw new ResponseError(
      `Response status code ${response.status}: ${response.data.retVal}`,
    )
  }
  if (typeof response.data.retVal === 'object') {
    throw new ResponseError(
      `Response status code ${response.status}: ${response.data.retVal.errorMessage}`,
    )
  }
  throw new ResponseError(
    `Response status code ${response.status}: ${response.message}`,
  )
}

export const handleAxiosError = (error: AxiosError): never => {
  if (error.response) {
    processResponseError(error.response)
  } else if (error.request) {
    throw new RequestError(`${error.message}`)
  }
  throw new Error(`Error ${error.message}`)
}
