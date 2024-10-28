import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-http-bearer'
import { LongRunningTokenService } from './long.running.token.service'
import { KeyCloakService } from '@B-S-F/api-keycloak-auth-lib'
import { AuthCache } from './long.running.token.cache'

export const LONG_RUNNING_TOKEN_STRATEGY_NAME = 'LRT'

@Injectable()
export class LongRunningTokenStrategy extends PassportStrategy(
  Strategy,
  LONG_RUNNING_TOKEN_STRATEGY_NAME
) {
  constructor(
    @Inject(AuthCache)
    private readonly authCache: AuthCache,
    @Inject(LongRunningTokenService)
    private readonly tokenService: LongRunningTokenService,
    @Inject(KeyCloakService)
    private readonly keycloakService: KeyCloakService
  ) {
    super()
  }

  async validate(token: string) {
    try {
      let user = this.authCache.get(token)

      if (user) {
        /*
         * If the user was found in the cache, we do not add it again.
         * This ensures that the user is not cached indefinitely
         */
        return user
      }

      const { id, try_admin } = await this.tokenService.retrieveKeyCloakUserId(
        token
      )

      user = await this.keycloakService.getKeyCloakUserFromCliClient(
        id,
        try_admin ? ['global'] : []
      )

      if (!user) {
        throw new UnauthorizedException()
      }

      this.authCache.put(token, user)
      return user
    } catch (e) {
      throw new UnauthorizedException(e)
    }
  }
}
