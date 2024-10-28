import { KeyCloakUser } from '@B-S-F/api-keycloak-auth-lib'
import { Inject, Injectable } from '@nestjs/common'

interface MapValue {
  user: KeyCloakUser
  timeOfAddition: number
}

@Injectable()
export class AuthCacheConfig {
  static readonly DEFAULT_VALIDITY_PERIOD_IN_MILLIS = 60_000
  readonly entryValidForMilliSeconds: number

  constructor() {
    this.entryValidForMilliSeconds =
      AuthCacheConfig.DEFAULT_VALIDITY_PERIOD_IN_MILLIS
  }
}

@Injectable()
export class AuthCache {
  private readonly map: Map<string, MapValue>
  private readonly entryValidForMilliSeconds: number

  constructor(
    @Inject(AuthCacheConfig)
    private readonly config: AuthCacheConfig
  ) {
    this.map = new Map<string, MapValue>()
    this.entryValidForMilliSeconds = config.entryValidForMilliSeconds
  }

  put(token: string, user: KeyCloakUser) {
    const mapValue = this.get(token)

    if (mapValue) {
      /*
       * We already have a valid entry in the cache.
       * Do not refresh the entry to prevent inadvertent
       * indefinite caching of the same old value
       */
      return
    }

    this.map.set(token, {
      user,
      timeOfAddition: Date.now(),
    })
  }

  get(token: string): KeyCloakUser {
    const mapValue = this.map.get(token)

    if (!mapValue) {
      return undefined
    }

    const { user, timeOfAddition } = mapValue

    if (Date.now() - timeOfAddition <= this.entryValidForMilliSeconds) {
      return user
    }

    return undefined
  }

  drop(token: string) {
    this.map.delete(token)
  }

  dropByKeyCloakId(kc_sub: string) {
    const tokens: string[] = []

    this.map.forEach((val, token) => {
      try {
        if (val.user.kc_sub === kc_sub) {
          tokens.push(token)
        }
      } catch (e) {
        // continue
      }
    })

    for (const token of tokens) {
      this.drop(token)
    }
  }

  dropAll() {
    this.map.clear()
  }
}
