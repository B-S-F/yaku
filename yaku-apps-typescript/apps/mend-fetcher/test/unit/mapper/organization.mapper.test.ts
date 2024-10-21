/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { describe, expect, it } from 'vitest'
import { Organization } from '../../../src/model/organization'
import { OrganizationDTO } from '../../../src/dto/organization.dto'
import { OrganizationMap } from '../../../src/mapper/organization.mapper'
import { organizationDTO } from '../fixtures/dto'
import { organizationModel } from '../fixtures/model'

describe('organization.mapper', () => {
  it('should return an Organization object', () => {
    const expected = organizationModel

    const result: Organization = OrganizationMap.toModel(organizationDTO)

    expect(result).toStrictEqual(expected)
  })
  it('should return an Organization DTO', () => {
    const expected = organizationDTO

    const result: OrganizationDTO = OrganizationMap.toDTO(organizationModel)

    expect(result).toStrictEqual(expected)
  })
})
