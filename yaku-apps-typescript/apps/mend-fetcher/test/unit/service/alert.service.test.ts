/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { MendEnvironment } from '../../../src/model/mendEnvironment'
import { AlertService } from '../../../src/service/alert.service'
import { PolicyAlert } from '../../../src/model/policyAlert'
import { SecurityAlert } from '../../../src/model/securityAlert'
import * as AlertFetcher from '../../../src/fetcher/alert.fetcher'
import { envFixture } from '../fixtures/env'
import { FakeAuthenticator } from '../fixtures/fakeauth'
import {
  multipleLicensesAlertsDTO,
  newVersionsAlertsDTO,
  policyAlertsDTO,
  rejectedInUseAlertsDTO,
} from '../fixtures/dto'
import {
  multipleLicensesAlertsModel,
  newVersionsAlertsModel,
  policyAlertsModel,
  rejectedInUseAlertsModel,
} from '../fixtures/model'
import { securityAlertsDTO } from '../fixtures/dto'
import { securityAlertsModel } from '../fixtures/model'
import { MultipleLicensesAlert } from '../../../src/model/multipleLicensesAlert'
import { NewVersionsAlert } from '../../../src/model/newVersionsAlert'
import { RejectedInUseAlert } from '../../../src/model/rejectedInUseAlert'

describe('alert.service', () => {
  const env: MendEnvironment = envFixture

  vi.mock('Authenticator', () => {
    const mock = {
      getInstance: vi.fn(() => new FakeAuthenticator(env)),
    }
    return mock
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('policy.alerts', () => {
    it('should return a list of Policy Alerts', async () => {
      const spy = vi.spyOn(AlertFetcher, 'getPolicyAlertDTOs')
      spy.mockReturnValue(Promise.resolve(policyAlertsDTO))
      const expected: PolicyAlert[] = policyAlertsModel

      const alertService: AlertService = new AlertService(env)
      const result: PolicyAlert[] = await alertService.getPolicyAlertsById(
        env.projectToken,
        'all',
      )

      expect(result).toStrictEqual(expected)
    })
  })

  describe('multipleLicenses.alerts', () => {
    it('should return a list of Multiple Licenses Alerts', async () => {
      const spy = vi.spyOn(AlertFetcher, 'getMultipleLicensesAlertDTOs')
      spy.mockReturnValue(Promise.resolve(multipleLicensesAlertsDTO))
      const expected: MultipleLicensesAlert[] = multipleLicensesAlertsModel

      const alertService: AlertService = new AlertService(env)
      const result: MultipleLicensesAlert[] =
        await alertService.getMultipleLicensesAlertsById(
          env.projectToken,
          'all',
        )

      expect(result).toStrictEqual(expected)
    })
  })

  describe('newVersions.alerts', () => {
    it('should return a list of New Versions Alerts', async () => {
      const spy = vi.spyOn(AlertFetcher, 'getNewVersionsAlertDTOs')
      spy.mockReturnValue(Promise.resolve(newVersionsAlertsDTO))
      const expected: NewVersionsAlert[] = newVersionsAlertsModel

      const alertService: AlertService = new AlertService(env)
      const result: NewVersionsAlert[] =
        await alertService.getNewVersionsAlertsById(env.projectToken, 'all')

      expect(result).toStrictEqual(expected)
    })
  })

  describe('rejectedInUse.alerts', () => {
    it('should return a list of Rejected In Use Alerts', async () => {
      const spy = vi.spyOn(AlertFetcher, 'getRejectedInUseAlertDTOs')
      spy.mockReturnValue(Promise.resolve(rejectedInUseAlertsDTO))
      const expected: RejectedInUseAlert[] = rejectedInUseAlertsModel

      const alertService: AlertService = new AlertService(env)
      const result: RejectedInUseAlert[] =
        await alertService.getRejectedInUseAlertsById(env.projectToken, 'all')

      expect(result).toStrictEqual(expected)
    })
  })

  describe('security.alerts', () => {
    it('should return a list of Security Alerts', async () => {
      const spy = vi.spyOn(AlertFetcher, 'getSecurityAlertDTOs')
      spy.mockReturnValue(Promise.resolve(securityAlertsDTO))
      const expected: SecurityAlert[] = securityAlertsModel

      const alertService: AlertService = new AlertService(env)
      const result: SecurityAlert[] = await alertService.getSecurityAlertsById(
        env.projectToken,
        'all',
      )

      expect(result).toStrictEqual(expected)
    })
  })
})
