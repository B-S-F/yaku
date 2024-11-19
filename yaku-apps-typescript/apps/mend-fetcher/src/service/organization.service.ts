// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Authenticator } from '../auth/auth.js'
import { getOrganizationDTO } from '../fetcher/organization.fetcher.js'
import { Organization } from '../model/organization.js'
import { OrganizationMap } from '../mapper/organization.mapper.js'
import { MendEnvironment } from '../model/mendEnvironment.js'

export class OrganizationService {
  private auth: Authenticator
  private env: MendEnvironment

  constructor(env: MendEnvironment) {
    this.env = env
    this.auth = Authenticator.getInstance(env)
  }

  async getOrganizationById(orgToken: string): Promise<Organization> {
    const organizationDto = await getOrganizationDTO(
      this.env.apiUrl,
      { orgToken: orgToken },
      this.auth,
    )
    const organization = OrganizationMap.toModel(organizationDto)

    return organization
  }
}
