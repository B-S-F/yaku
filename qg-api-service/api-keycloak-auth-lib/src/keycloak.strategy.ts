import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { KeyCloakService } from './keycloak.service'
import { Strategy } from 'passport-custom'

export const KEYCLOAK_STRATEGY_NAME = 'KeyCloak'

@Injectable()
export class KeyCloakStrategy extends PassportStrategy(
  Strategy,
  KEYCLOAK_STRATEGY_NAME,
) {
  constructor(
    @Inject(KeyCloakService) private readonly keyCloakService: KeyCloakService,
  ) {
    super()
  }

  async validate(req: Request) {
    const isValid = await this.keyCloakService.introspectToken(req)
    if (!isValid) {
      throw new UnauthorizedException()
    }
    const jwt = req.headers['authorization'].split(' ')[1]
    return this.keyCloakService.getKeyCloakUser(jwt)
  }
}
