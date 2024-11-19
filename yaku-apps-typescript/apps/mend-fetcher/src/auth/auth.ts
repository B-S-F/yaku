// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { auth } from '../fetcher/auth.fetcher.js'
import { Login } from '../model/login.js'
import { MendEnvironment } from '../model/mendEnvironment.js'

export class Authenticator {
  private static _instance: Authenticator
  private env: MendEnvironment
  private login: Login | undefined

  private constructor(env: MendEnvironment) {
    this.env = env
  }

  static getInstance(env: MendEnvironment): Authenticator {
    if (!Authenticator._instance) {
      Authenticator._instance = new Authenticator(env)
    }

    return Authenticator._instance
  }
  async authenticate(): Promise<Login> {
    if (!this.login) {
      this.login = await auth(
        this.env.apiUrl,
        this.env.email,
        this.env.orgToken,
        this.env.userKey,
      )
    } else {
      if (this.isLoginExpired()) {
        this.login = await auth(
          this.env.apiUrl,
          this.env.email,
          this.env.orgToken,
          this.env.userKey,
        )
      }
    }

    return this.login
  }

  private isLoginExpired(): boolean {
    const now = new Date().valueOf()
    if (this.login && this.login.sessionStartTime + this.login.jwtTTL < now) {
      return true
    }

    return false
  }
}
