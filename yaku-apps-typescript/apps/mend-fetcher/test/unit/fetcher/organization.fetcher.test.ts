/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Authenticator } from '../../../src/auth/auth'
import { axiosInstance } from '../../../src/fetcher/common.fetcher'
import { getOrganizationDTO } from '../../../src/fetcher/organization.fetcher'
import { MendEnvironment } from '../../../src/model/mendEnvironment'
import { OrganizationDTO } from '../../../src/dto/organization.dto'
import { envFixture } from '../fixtures/env'
import { HTTPResponseStatusCodes } from '../fixtures/httpResponseStatus'
import { FakeAuthenticator } from '../fixtures/fakeauth'
import { organizationDTO } from '../fixtures/dto'
import { organizationData } from '../fixtures/data'

describe('organization.fetcher', () => {
  const env: MendEnvironment = envFixture

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('should retrieve organization information', async () => {
    const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
    const spy = vi.spyOn(axiosInstance, 'request')
    spy.mockReturnValueOnce(
      Promise.resolve({
        data: {
          additionalData: {},
          retVal: organizationData,
        },
      })
    )
    const expected: OrganizationDTO = organizationDTO

    const result: OrganizationDTO = await getOrganizationDTO(
      env.apiUrl,
      { orgToken: env.orgToken },
      fakeAuth as unknown as Authenticator
    )

    expect(result).toStrictEqual(expected)
  })

  it('should throw an error when unexpected data is returned', async () => {
    const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
    const spy = vi.spyOn(axiosInstance, 'request')
    spy.mockReturnValueOnce(Promise.resolve({ data: { not: 'expected' } }))

    const result = getOrganizationDTO(
      env.apiUrl,
      { orgToken: env.orgToken },
      fakeAuth as unknown as Authenticator
    )

    await expect(result).rejects.toThrowError('No expected values are returned')
  })

  it('should throw an error when request is not successful', async () => {
    const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
    const spy = vi.spyOn(axiosInstance, 'request')
    spy.mockReturnValueOnce(
      Promise.reject({
        isAxiosError: true,
        request: {},
        message: 'Request Error Message',
      })
    )

    const result = getOrganizationDTO(
      env.apiUrl,
      { orgToken: env.orgToken },
      fakeAuth as unknown as Authenticator
    )

    await expect(result).rejects.toThrowError('Request Error Message')
  })

  it.each(HTTPResponseStatusCodes)(
    'should throw an error when response falls out of the 2xx range',
    async (httpStatus) => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.reject({
          isAxiosError: true,
          response: {
            status: httpStatus.code,
            data: {},
            statusText: httpStatus.message,
          },
        })
      )

      const result = getOrganizationDTO(
        env.apiUrl,
        { orgToken: env.orgToken },
        fakeAuth as unknown as Authenticator
      )

      await expect(result).rejects.toThrowError(
        `Response status code ${httpStatus.code}: ${httpStatus.message}`
      )
    }
  )

  it.each(HTTPResponseStatusCodes)(
    'should throw an error when response falls out of the 2xx range and supportToken is provided',
    async (httpStatus) => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.reject({
          isAxiosError: true,
          response: {
            data: {
              retVal: { errorMessage: httpStatus.message },
              supportToken: 'boo!',
            },
            statusText: '',
            status: httpStatus.code,
          },
        })
      )

      const result = getOrganizationDTO(
        env.apiUrl,
        { orgToken: env.orgToken },
        fakeAuth as unknown as Authenticator
      )

      await expect(result).rejects.toThrowError(
        `Response status code ${httpStatus.code}: ${httpStatus.message}`
      )
    }
  )

  it('should throw an error when it fails for unexpected reasons', async () => {
    const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
    const spy = vi.spyOn(axiosInstance, 'request')
    spy.mockReturnValueOnce(Promise.reject())

    const result = getOrganizationDTO(
      env.apiUrl,
      { orgToken: env.orgToken },
      fakeAuth as unknown as Authenticator
    )

    await expect(result).rejects.toThrowError()
  })
})
