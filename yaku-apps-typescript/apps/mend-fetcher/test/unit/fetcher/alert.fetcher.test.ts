/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Authenticator } from '../../../src/auth/auth'
import { axiosInstance } from '../../../src/fetcher/common.fetcher'
import {
  getPolicyAlertDTOs,
  getNewVersionsAlertDTOs,
  getMultipleLicensesAlertDTOs,
  getRejectedInUseAlertDTOs,
  getSecurityAlertDTOs,
} from '../../../src/fetcher/alert.fetcher'
import { MendEnvironment } from '../../../src/model/mendEnvironment'
import { PolicyAlertDTO } from '../../../src/dto/policyAlert.dto'
import { NewVersionsAlertDTO } from '../../../src/dto/newVersionsAlert.dto'
import { MultipleLicensesAlertDTO } from '../../../src/dto/multipleLicensesAlert.dto'
import { RejectedInUseAlertDTO } from '../../../src/dto/rejectedInUseAlert.dto'
import { SecurityAlertDTO } from '../../../src/dto/securityAlert.dto'
import { envFixture } from '../fixtures/env'
import { FakeAuthenticator } from '../fixtures/fakeauth'
import { HTTPResponseStatusCodes } from '../fixtures/httpResponseStatus'
import {
  policyAlertsData,
  securityAlertsData,
  newVersionsAlertsData,
  multipleLicensesAlertsData,
  rejectedInUseAlertsData,
} from '../fixtures/data'
import {
  policyAlertsDTO,
  securityAlertsDTO,
  newVersionsAlertsDTO,
  multipleLicensesAlertsDTO,
  rejectedInUseAlertsDTO,
} from '../fixtures/dto'

describe('alert.fetcher', () => {
  const env: MendEnvironment = envFixture

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('policy.alerts', () => {
    it("should retrieve 'active' policy alerts when there is a single page response", async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: policyAlertsData,
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [],
          },
        }),
      )
      const expected: PolicyAlertDTO[] = policyAlertsDTO

      const result: PolicyAlertDTO[] = await getPolicyAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'active' },
        fakeAuth as unknown as Authenticator,
      )

      expect(result).toStrictEqual(expected)
    })

    it("should retrieve 'all' policy alerts when there is a multipage response", async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [policyAlertsData[0]],
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [policyAlertsData[1]],
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [],
          },
        }),
      )
      const expected: PolicyAlertDTO[] = policyAlertsDTO

      const result: PolicyAlertDTO[] = await getPolicyAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'all' },
        fakeAuth as unknown as Authenticator,
      )

      expect(result).toStrictEqual(expected)
    })

    it('should throw an error when unexpected data is returned', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(Promise.resolve({ data: { not: 'expected' } }))

      const result = getPolicyAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError('No expected values returned')
    })

    it('should throw an error when request is not successful', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.reject({
          isAxiosError: true,
          request: {},
          message: 'Request Error Message',
        }),
      )

      const result = getPolicyAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
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
          }),
        )

        const result = getPolicyAlertDTOs(
          env.apiUrl,
          { projectToken: env.projectToken, status: 'status' },
          fakeAuth as unknown as Authenticator,
        )

        await expect(result).rejects.toThrowError(
          `Response status code ${httpStatus.code}: ${httpStatus.message}`,
        )
      },
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
          }),
        )

        const result = getPolicyAlertDTOs(
          env.apiUrl,
          { projectToken: env.projectToken, status: 'status' },
          fakeAuth as unknown as Authenticator,
        )

        await expect(result).rejects.toThrowError(
          `Response status code ${httpStatus.code}: ${httpStatus.message}`,
        )
      },
    )

    it('should throw an error when it fails for unexpected reasons', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(Promise.reject())

      const result = getPolicyAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError()
    })
  })

  describe('newVersions.alerts', () => {
    it("should retrieve 'active' New Versions alerts when there is a single page response", async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: newVersionsAlertsData,
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [],
          },
        }),
      )
      const expected: NewVersionsAlertDTO[] = newVersionsAlertsDTO

      const result: NewVersionsAlertDTO[] = await getNewVersionsAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'active' },
        fakeAuth as unknown as Authenticator,
      )

      expect(result).toStrictEqual(expected)
    })

    it("should retrieve 'all' New Versions alerts when there is a multipage response", async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [newVersionsAlertsData[0]],
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [newVersionsAlertsData[1]],
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [],
          },
        }),
      )
      const expected: NewVersionsAlertDTO[] = newVersionsAlertsDTO

      const result: NewVersionsAlertDTO[] = await getNewVersionsAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'all' },
        fakeAuth as unknown as Authenticator,
      )

      expect(result).toStrictEqual(expected)
    })

    it('should throw an error when unexpected data is returned', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(Promise.resolve({ data: { not: 'expected' } }))

      const result = getNewVersionsAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError('No expected values returned')
    })

    it('should throw an error when request is not successful', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.reject({
          isAxiosError: true,
          request: {},
          message: 'Request error message',
        }),
      )

      const result = getNewVersionsAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError('Request error message')
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
          }),
        )

        const result = getNewVersionsAlertDTOs(
          env.apiUrl,
          { projectToken: env.projectToken, status: 'status' },
          fakeAuth as unknown as Authenticator,
        )

        await expect(result).rejects.toThrowError(
          `Response status code ${httpStatus.code}: ${httpStatus.message}`,
        )
      },
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
          }),
        )

        const result = getNewVersionsAlertDTOs(
          env.apiUrl,
          { projectToken: env.projectToken, status: 'status' },
          fakeAuth as unknown as Authenticator,
        )

        await expect(result).rejects.toThrowError(
          `Response status code ${httpStatus.code}: ${httpStatus.message}`,
        )
      },
    )

    it('should throw an error when it fails for unexpected reasons', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(Promise.reject())

      const result = getNewVersionsAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError()
    })
  })

  describe('multipleLicenses.alerts', () => {
    it("should retrieve 'active' Multiple Licenses alerts when there is a single page response", async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: multipleLicensesAlertsData,
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [],
          },
        }),
      )
      const expected: MultipleLicensesAlertDTO[] = multipleLicensesAlertsDTO

      const result: MultipleLicensesAlertDTO[] =
        await getMultipleLicensesAlertDTOs(
          env.apiUrl,
          { projectToken: env.projectToken, status: 'active' },
          fakeAuth as unknown as Authenticator,
        )

      expect(result).toStrictEqual(expected)
    })

    it("should retrieve 'all' Multiple Licenses alerts when there is a multipage response", async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [multipleLicensesAlertsData[0]],
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [multipleLicensesAlertsData[1]],
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [],
          },
        }),
      )
      const expected: MultipleLicensesAlertDTO[] = multipleLicensesAlertsDTO

      const result: MultipleLicensesAlertDTO[] =
        await getMultipleLicensesAlertDTOs(
          env.apiUrl,
          { projectToken: env.projectToken, status: 'all' },
          fakeAuth as unknown as Authenticator,
        )

      expect(result).toStrictEqual(expected)
    })

    it('should throw an error when unexpected data is returned', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(Promise.resolve({ data: { not: 'expected' } }))

      const result = getMultipleLicensesAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError('No expected values returned')
    })

    it('should throw an error when request is not successful', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.reject({
          isAxiosError: true,
          request: {},
          message: 'Request error message',
        }),
      )

      const result = getMultipleLicensesAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError('Request error message')
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
          }),
        )

        const result = getMultipleLicensesAlertDTOs(
          env.apiUrl,
          { projectToken: env.projectToken, status: 'status' },
          fakeAuth as unknown as Authenticator,
        )

        await expect(result).rejects.toThrowError(
          `Response status code ${httpStatus.code}: ${httpStatus.message}`,
        )
      },
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
          }),
        )

        const result = getMultipleLicensesAlertDTOs(
          env.apiUrl,
          { projectToken: env.projectToken, status: 'status' },
          fakeAuth as unknown as Authenticator,
        )

        await expect(result).rejects.toThrowError(
          `Response status code ${httpStatus.code}: ${httpStatus.message}`,
        )
      },
    )

    it('should throw an error when it fails for unexpected reasons', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(Promise.reject())

      const result = getMultipleLicensesAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError()
    })
  })

  describe('rejectedInUse.alerts', () => {
    it("should retrieve 'active' Rejected In Use alerts when there is a single page response", async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: rejectedInUseAlertsData,
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [],
          },
        }),
      )
      const expected: RejectedInUseAlertDTO[] = rejectedInUseAlertsDTO

      const result: RejectedInUseAlertDTO[] = await getRejectedInUseAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'active' },
        fakeAuth as unknown as Authenticator,
      )

      expect(result).toStrictEqual(expected)
    })

    it("should retrieve 'all' Rejected In Use alerts when there is a multipage response", async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [rejectedInUseAlertsData[0]],
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [rejectedInUseAlertsData[1]],
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [],
          },
        }),
      )
      const expected: RejectedInUseAlertDTO[] = rejectedInUseAlertsDTO

      const result: RejectedInUseAlertDTO[] = await getRejectedInUseAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'all' },
        fakeAuth as unknown as Authenticator,
      )

      expect(result).toStrictEqual(expected)
    })

    it('should throw an error when unexpected data is returned', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(Promise.resolve({ data: { not: 'expected' } }))

      const result = getRejectedInUseAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError('No expected values returned')
    })

    it('should throw an error when request is not successful', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.reject({
          isAxiosError: true,
          request: {},
          message: 'Request error message',
        }),
      )

      const result = getRejectedInUseAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError('Request error message')
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
          }),
        )

        const result = getRejectedInUseAlertDTOs(
          env.apiUrl,
          { projectToken: env.projectToken, status: 'status' },
          fakeAuth as unknown as Authenticator,
        )

        await expect(result).rejects.toThrowError(
          `Response status code ${httpStatus.code}: ${httpStatus.message}`,
        )
      },
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
          }),
        )

        const result = getRejectedInUseAlertDTOs(
          env.apiUrl,
          { projectToken: env.projectToken, status: 'status' },
          fakeAuth as unknown as Authenticator,
        )

        await expect(result).rejects.toThrowError(
          `Response status code ${httpStatus.code}: ${httpStatus.message}`,
        )
      },
    )

    it('should throw an error when it fails for unexpected reasons', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(Promise.reject())

      const result = getRejectedInUseAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError()
    })
  })

  describe('security.alerts', () => {
    it("should retrieve 'active' security alerts when there is a single page response", async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: securityAlertsData,
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({ data: { additionalData: {}, retVal: [] } }),
      )
      const expected: SecurityAlertDTO[] = securityAlertsDTO

      const result: SecurityAlertDTO[] = await getSecurityAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'active' },
        fakeAuth as unknown as Authenticator,
      )

      expect(result).toStrictEqual(expected)
    })

    it("should retrieve 'all' security alerts when there is a multipage response", async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [securityAlertsData[0]],
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: [securityAlertsData[1]],
          },
        }),
      )
      spy.mockReturnValueOnce(
        Promise.resolve({ data: { additionalData: {}, retVal: [] } }),
      )
      const expected: SecurityAlertDTO[] = securityAlertsDTO

      const result: SecurityAlertDTO[] = await getSecurityAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'all' },
        fakeAuth as unknown as Authenticator,
      )

      expect(result).toStrictEqual(expected)
    })

    it('should throw an error when unexpected data is returned', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(Promise.resolve({ data: { not: 'expected' } }))

      const result = getSecurityAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError('No expected values returned')
    })

    it('should throw an error when request is not successful', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.reject({
          isAxiosError: true,
          request: {},
          message: 'Request error message',
        }),
      )

      const result = getSecurityAlertDTOs(
        env.apiUrl,

        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError('Request error message')
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
          }),
        )

        const result = getSecurityAlertDTOs(
          env.apiUrl,
          { projectToken: env.projectToken, status: 'status' },
          fakeAuth as unknown as Authenticator,
        )

        await expect(result).rejects.toThrowError(
          `Response status code ${httpStatus.code}: ${httpStatus.message}`,
        )
      },
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
          }),
        )

        const result = getSecurityAlertDTOs(
          env.apiUrl,
          { projectToken: env.projectToken, status: 'status' },
          fakeAuth as unknown as Authenticator,
        )

        await expect(result).rejects.toThrowError(
          `Response status code ${httpStatus.code}: ${httpStatus.message}`,
        )
      },
    )

    it('should throw an error when it fails for unexpected reasons', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(Promise.reject())

      const result = getSecurityAlertDTOs(
        env.apiUrl,
        { projectToken: env.projectToken, status: 'status' },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError()
    })
  })
})
