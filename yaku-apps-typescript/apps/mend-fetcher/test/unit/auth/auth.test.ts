// SPDX-FileCopyrightText: 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Authenticator } from '../../../src/auth/auth'
import { Login } from '../../../src/model/login'
import { MendEnvironment } from '../../../src/model/mendEnvironment'
import * as authFetcher from '../../../src/fetcher/auth.fetcher'
import { envFixture } from '../fixtures/env'
import { organizationData } from '../fixtures/data'

describe('auth', () => {
  const env: MendEnvironment = envFixture

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should only create one instance of Authenticator', () => {
    const expected: Authenticator = Authenticator.getInstance(env)

    const result = Authenticator.getInstance(env)

    expect(result).toBeInstanceOf(Authenticator)
    expect(result).to.be.equal(expected)
  })

  it('should return a valid Login object', async () => {
    const fakeSystemDate = new Date(2023, 1, 1, 0, 0, 0, 0)
    vi.setSystemTime(fakeSystemDate)
    const spy = vi.spyOn(authFetcher, 'auth')
    spy.mockReturnValue(
      Promise.resolve(
        new Login(
          `${env.email.split('@')[0]}-userUuid`,
          `${env.email.split('@')[0]}-userName`,
          env.email,
          'jwtToken',
          'jwtRefresh',
          1800000,
          organizationData.name,
          organizationData.uuid,
          fakeSystemDate.valueOf(),
        ),
      ),
    )

    const auth: Authenticator = Authenticator.getInstance(env)
    const expected = new Login(
      `${env.email.split('@')[0]}-userUuid`,
      `${env.email.split('@')[0]}-userName`,
      env.email,
      'jwtToken',
      'jwtRefresh',
      1800000,
      organizationData.name,
      organizationData.uuid,
      fakeSystemDate.valueOf(),
    )

    const result: Login = await auth.authenticate()

    expect(result).toStrictEqual(expected)
  })

  it('should return the same Login object when authentication has not expired', async () => {
    const fakeSystemDate = new Date(2023, 1, 1, 0, 20, 0, 0)
    vi.setSystemTime(fakeSystemDate)
    const spy = vi.spyOn(authFetcher, 'auth')
    spy.mockReturnValue(
      Promise.resolve(
        new Login(
          `${env.email.split('@')[0]}-userUuid`,
          `${env.email.split('@')[0]}-userName`,
          env.email,
          'jwtToken',
          'jwtRefresh',
          1800000,
          organizationData.name,
          organizationData.uuid,
          new Date(2023, 1, 1, 0, 0, 0, 0).valueOf(),
        ),
      ),
    )

    const auth: Authenticator = Authenticator.getInstance(env)
    const expected = new Login(
      `${env.email.split('@')[0]}-userUuid`,
      `${env.email.split('@')[0]}-userName`,
      env.email,
      'jwtToken',
      'jwtRefresh',
      1800000,
      organizationData.name,
      organizationData.uuid,
      new Date(2023, 1, 1, 0, 0, 0, 0).valueOf(),
    )

    const result: Login = await auth.authenticate()

    expect(result).toStrictEqual(expected)
  })

  it('should return a new Login object when authentication has expired', async () => {
    const fakeSystemDate = new Date(2023, 1, 1, 0, 35, 0, 0)
    vi.setSystemTime(fakeSystemDate)
    const spy = vi.spyOn(authFetcher, 'auth')
    spy.mockReturnValue(
      Promise.resolve(
        new Login(
          `${env.email.split('@')[0]}-userUuid`,
          `${env.email.split('@')[0]}-userName`,
          env.email,
          'jwtToken2',
          'jwtRefresh2',
          1800000,
          organizationData.name,
          organizationData.uuid,
          fakeSystemDate.valueOf(),
        ),
      ),
    )

    const auth: Authenticator = Authenticator.getInstance(env)
    const expected = new Login(
      `${env.email.split('@')[0]}-userUuid`,
      `${env.email.split('@')[0]}-userName`,
      env.email,
      'jwtToken2',
      'jwtRefresh2',
      1800000,
      organizationData.name,
      organizationData.uuid,
      fakeSystemDate.valueOf(),
    )

    const result: Login = await auth.authenticate()

    expect(result).toStrictEqual(expected)
  })
})
