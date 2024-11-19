/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { auth } from '../../../src/fetcher/auth.fetcher'
import { axiosInstance } from '../../../src/fetcher/common.fetcher'
import { Login } from '../../../src/model/login'
import { MendEnvironment } from '../../../src/model/mendEnvironment'
import { envFixture } from '../fixtures/env'
import { HTTPResponseStatusCodes } from '../fixtures/httpResponseStatus'
import { organizationData } from '../fixtures/data'
import { AxiosError } from 'axios'

describe('auth.fetcher', () => {
  const env: MendEnvironment = envFixture

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('should return a Login object when the request is successful', async () => {
    const now = new Date().valueOf()
    const spy = vi.spyOn(axiosInstance, 'request')
    spy.mockReturnValue(
      Promise.resolve({
        data: {
          retVal: {
            userUuid: `${env.email.split('@')[0]}-userUuid`,
            userName: `${env.email.split('@')[0]}-userName`,
            email: env.email,
            refreshToken: `jwtRefresh`,
            jwtToken: `jwtToken`,
            orgName: organizationData.name,
            orgUuid: organizationData.uuid,
            domainName: ``,
            domainUuid: ``,
            accountName: ``,
            accountUuid: ``,
            jwtTTL: 1800000,
            sessionStartTime: now,
          },
        },
      }),
    )
    const expected = new Login(
      `${env.email.split('@')[0]}-userUuid`,
      `${env.email.split('@')[0]}-userName`,
      env.email,
      'jwtToken',
      'jwtRefresh',
      1800000,
      organizationData.name,
      organizationData.uuid,
      now,
    )

    const result: Login = await auth(
      env.apiUrl,
      env.email,
      env.orgToken,
      env.userKey,
    )

    expect(result).toStrictEqual(expected)
  })

  it('should throw an error when unexpected values are returned', async () => {
    const spy = vi.spyOn(axiosInstance, 'request')
    spy.mockReturnValue(Promise.resolve({ data: {} }))

    const result = auth(env.apiUrl, env.email, env.orgToken, env.userKey)
    await expect(result).rejects.toThrowError('No expected values returned')
  })

  it('should throw an error when request is not successful', async () => {
    const spy = vi.spyOn(axiosInstance, 'request')
    spy.mockReturnValue(
      Promise.reject({
        request: 'Request data',
        message: 'Request error',
        isAxiosError: true,
      } as AxiosError),
    )

    const result = auth(env.apiUrl, env.email, env.orgToken, env.userKey)
    await expect(result).rejects.toThrowError('Request error')
  })

  it.each(HTTPResponseStatusCodes)(
    'should throw an error when reponse falls out of the 2xx range',
    async (httpStatus) => {
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValue(
        Promise.reject({
          response: {
            status: httpStatus.code,
            data: { error: httpStatus.message },
          },
          isAxiosError: true,
        } as AxiosError),
      )

      const result = auth(env.apiUrl, env.email, env.orgToken, env.userKey)
      await expect(result).rejects.toThrowError(
        `Response status code ${httpStatus.code}: ${httpStatus.message}`,
      )
    },
  )

  it.each(HTTPResponseStatusCodes)(
    'should throw an error when reponse falls out of the 2xx range and supportToken is provided',
    async (httpStatus) => {
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValue(
        Promise.reject({
          response: {
            status: httpStatus.code,
            data: { retVal: httpStatus.message, supportToken: 'boo!' },
          },
          isAxiosError: true,
        } as AxiosError),
      )

      const result = auth(env.apiUrl, env.email, env.orgToken, env.userKey)
      await expect(result).rejects.toThrowError(
        `Response status code ${httpStatus.code}: ${httpStatus.message}`,
      )
    },
  )
})
