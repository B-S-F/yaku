// SPDX-FileCopyrightText: 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleAxiosError } from '../../../src/fetcher/errors.fetcher'
import { AxiosError } from 'axios'

describe('errors.fetcher', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('handleAxiosError', () => {
    it('should throw a ResponseError when AxiosError includes response information', async () => {
      const responseError = {
        isAxiosError: true,
        response: {
          data: { retVal: 123 },
          status: 599,
          message: 'Custome Error Message',
        },
      }

      const result = new Promise((resolve) => {
        resolve(handleAxiosError(responseError as unknown as AxiosError))
      })
      await expect(result).rejects.toThrowError(
        `Response status code ${responseError.response.status}: ${responseError.response?.message}`,
      )
    })

    it('should throw a RequestError when AxiosError provides only request information', async () => {
      const responseError = {
        isAxiosError: true,
        request: {},
        message: 'Custom Error Message',
      } as AxiosError

      const result = new Promise((resolve) => {
        resolve(handleAxiosError(responseError))
      })

      await expect(result).rejects.toThrowError(
        `RequestError: ${responseError.message}`,
      )
    })

    it('should throw an error when AxiosError has unexpected format', async () => {
      const unexpectedError = {
        isAxiosError: true,
        message: 'Custom Error Message',
      } as AxiosError

      const result = new Promise((resolve) => {
        resolve(handleAxiosError(unexpectedError))
      })

      await expect(result).rejects.toThrowError(
        `Error ${unexpectedError.message}`,
      )
    })
  })

  describe('processResponseError', () => {
    it('should throw a ResponseError when AxiosError response provides no data', async () => {
      const responseError = {
        isAxiosError: true,
        response: {
          status: 599,
          statusText: '',
          message: 'Custom Error Message',
        },
        message: 'Custom Error Message',
        status: 599,
      } as unknown as AxiosError

      const result = new Promise((resolve) => {
        resolve(handleAxiosError(responseError))
      })

      await expect(result).rejects.toThrowError(
        `Response status code ${responseError.status}: ${responseError.message}`,
      )
    })

    it('should throw a ResponseError when AxiosError response data provides no retVal but a statusText', async () => {
      const responseError = {
        isAxiosError: true,
        response: { status: 599, data: {}, statusText: 'Custom Error Message' },
        message: 'Custom Error Message',
        status: 599,
      } as AxiosError

      const result = new Promise((resolve) => {
        resolve(handleAxiosError(responseError))
      })

      await expect(result).rejects.toThrowError(
        `Response status code ${responseError.response?.status}: ${responseError.response?.statusText}`,
      )
    })

    it('should throw a ResponseError when AxiosError response data provides no retVal and no statusText', async () => {
      const responseError = {
        isAxiosError: true,
        response: {
          status: 599,
          data: { error: 'Custom Error Message' },
          statusText: '',
        },
      }

      const result = new Promise((resolve) => {
        resolve(handleAxiosError(responseError as unknown as AxiosError))
      })

      await expect(result).rejects.toThrowError(
        `Response status code ${responseError.response.status}: ${responseError.response.data.error}`,
      )
    })

    it('should throw a ResponseError when AxiosError response data retVal is a simple message', async () => {
      const responseError = {
        isAxiosError: true,
        response: {
          data: { retVal: 'Customer Error Message', supportToken: 'boo!' },
          status: 599,
          statusText: '',
        },
      }

      const result = new Promise((resolve) => {
        resolve(handleAxiosError(responseError as unknown as AxiosError))
      })

      await expect(result).rejects.toThrowError(
        `Response status code ${responseError.response.status}: ${responseError.response.data.retVal}`,
      )
    })

    it('should throw a ResponseError when AxiosError response data retVal is an object containing the error message', async () => {
      const responseError = {
        isAxiosError: true,
        response: {
          data: {
            retVal: { errorMessage: 'Customer Error Message' },
            supportToken: 'boo!',
          },
          statusText: '',
          status: 599,
        },
      }

      const result = new Promise((resolve) => {
        resolve(handleAxiosError(responseError as AxiosError))
      })

      await expect(result).rejects.toThrowError(
        `Response status code ${responseError.response.status}: ${responseError.response.data.retVal.errorMessage}`,
      )
    })
  })
})
