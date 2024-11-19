/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Authenticator } from '../../../src/auth/auth'
import { axiosInstance } from '../../../src/fetcher/common.fetcher'
import {
  getProjectDTO,
  getProjectVitalsDTO,
} from '../../../src/fetcher/project.fetcher'
import { MendEnvironment } from '../../../src/model/mendEnvironment'
import { ProjectDTO } from '../../../src/dto/project.dto'
import { ProjectVitalsDTO } from '../../../src/dto/projectVitals.dto'
import { envFixture } from '../fixtures/env'
import { HTTPResponseStatusCodes } from '../fixtures/httpResponseStatus'
import { FakeAuthenticator } from '../fixtures/fakeauth'
import { projectData, projectVitalsData } from '../fixtures/data'
import { projectDTO, projectVitalsDTO } from '../fixtures/dto'

describe('project.fetcher', () => {
  const env: MendEnvironment = envFixture

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('project', () => {
    it('should retrieve project information', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: projectData,
          },
        }),
      )
      const expected: ProjectDTO = projectDTO

      const result: ProjectDTO = await getProjectDTO(
        env.apiUrl,
        { projectToken: env.projectToken },
        fakeAuth as unknown as Authenticator,
      )

      expect(result).toStrictEqual(expected)
    })

    it('should throw an error when unexpected data is returned', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(Promise.resolve({ data: { not: 'expected' } }))

      const result = getProjectDTO(
        env.apiUrl,
        { projectToken: env.projectToken },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError(
        'No expected values are returned',
      )
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

      const result = getProjectDTO(
        env.apiUrl,
        { projectToken: env.projectToken },
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

        const result = getProjectDTO(
          env.apiUrl,
          { projectToken: env.projectToken },
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

        const result = getProjectDTO(
          env.apiUrl,
          { projectToken: env.projectToken },
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

      const result = getProjectDTO(
        env.apiUrl,
        { projectToken: env.projectToken },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError()
    })
  })

  describe('projectVitals', () => {
    it('should retrieve project vitals information', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(
        Promise.resolve({
          data: {
            additionalData: {},
            retVal: projectVitalsData,
            supportToken: 'supportToken',
          },
        }),
      )
      const expected: ProjectVitalsDTO = projectVitalsDTO

      const result: ProjectVitalsDTO = await getProjectVitalsDTO(
        env.apiUrl,
        { projectToken: env.projectToken },
        fakeAuth as unknown as Authenticator,
      )

      expect(result).toStrictEqual(expected)
    })

    it('should throw an error when unexpected data is returned', async () => {
      const fakeAuth: FakeAuthenticator = new FakeAuthenticator(env)
      const spy = vi.spyOn(axiosInstance, 'request')
      spy.mockReturnValueOnce(Promise.resolve({ data: { not: 'expected' } }))

      const result = getProjectVitalsDTO(
        env.apiUrl,
        { projectToken: env.projectToken },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError(
        'No expected values are returned',
      )
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

      const result = getProjectVitalsDTO(
        env.apiUrl,
        { projectToken: env.projectToken },
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

        const result = getProjectVitalsDTO(
          env.apiUrl,
          { projectToken: env.projectToken },
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

        const result = getProjectVitalsDTO(
          env.apiUrl,
          { projectToken: env.projectToken },
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

      const result = getProjectVitalsDTO(
        env.apiUrl,
        { projectToken: env.projectToken },
        fakeAuth as unknown as Authenticator,
      )

      await expect(result).rejects.toThrowError()
    })
  })
})
