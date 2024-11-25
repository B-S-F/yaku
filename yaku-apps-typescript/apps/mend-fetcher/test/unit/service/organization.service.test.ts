/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { MendEnvironment } from '../../../src/model/mendEnvironment'
import { Organization } from '../../../src/model/organization'
import { OrganizationService } from '../../../src/service/organization.service'
import * as OrganizationFetcher from '../../../src/fetcher/organization.fetcher'
import { envFixture } from '../fixtures/env'
import { FakeAuthenticator } from '../fixtures/fakeauth'
import { organizationDTO } from '../fixtures/dto'
import { organizationModel } from '../fixtures/model'

describe('organization.service', () => {
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

  it('should return an Organization object', async () => {
    const spy = vi.spyOn(OrganizationFetcher, 'getOrganizationDTO')
    spy.mockReturnValue(Promise.resolve(organizationDTO))
    const expected = organizationModel

    const organizationService = new OrganizationService(env)
    const result: Organization = await organizationService.getOrganizationById(
      env.orgToken,
    )

    expect(result).toStrictEqual(expected)
  })
})
