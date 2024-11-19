// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MendEnvironment } from '../../../src/model/mendEnvironment'
import { Login } from '../../../src/model/login'
import { organizationData } from './data'

export class FakeAuthenticator {
  private env: MendEnvironment
  constructor(env: MendEnvironment) {
    this.env = env
  }

  async authenticate() {
    return new Login(
      `${this.env.email.split('@')[0]}-userUuid`,
      `${this.env.email.split('@')[0]}-userName`,
      this.env.email,
      'jwtToken',
      'jwtRefresh',
      1800000,
      organizationData.name,
      organizationData.uuid,
      new Date().valueOf(),
    )
  }
}
