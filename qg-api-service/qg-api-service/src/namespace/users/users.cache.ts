import { Inject, Injectable } from '@nestjs/common'
import { UserInNamespaceDto } from './users.utils'

interface MapValue {
  user: UserInNamespaceDto
  timeOfAddition: number
}

@Injectable()
export class UsersCacheConfig {
  static readonly DEFAULT_VALIDITY_PERIOD_IN_MILLIS = 300_000
  readonly entryValidForMilliSeconds: number

  constructor() {
    this.entryValidForMilliSeconds =
      UsersCacheConfig.DEFAULT_VALIDITY_PERIOD_IN_MILLIS
  }
}

@Injectable()
export class UsersCache {
  private readonly map: Map<string, MapValue>
  private readonly entryValidForMilliSeconds: number

  constructor(
    @Inject(UsersCacheConfig)
    private readonly config: UsersCacheConfig
  ) {
    this.map = new Map<string, MapValue>()
    this.entryValidForMilliSeconds = config.entryValidForMilliSeconds
  }

  put(user: UserInNamespaceDto) {
    const mapValue = this.get(user.id)

    if (mapValue) {
      /*
       * We already have a valid entry in the cache.
       * Do not refresh the entry to prevent inadvertent
       * indefinite caching of the same old value
       */
      return
    }

    this.map.set(user.id, {
      user,
      timeOfAddition: Date.now(),
    })
  }

  get(userId: string): UserInNamespaceDto {
    const mapValue = this.map.get(userId)

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

  dropAll() {
    this.map.clear()
  }
}
