import { Inject, Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class AuthInfoDto {
  @ApiProperty({
    description:
      'The .well-known configuration URL of the OpenID Connect endpoints',
    example:
      'https://bswf.authz.bosch.com/auth/realms/azure-dev/.well-known/openid-configuration',
  })
  wellKnownConfigUrl: string
}

@Injectable()
export class AuthInfoServiceConfig {
  constructor(readonly wellKnownConfigUrl: string) {}
}

@Injectable()
export class AuthInfoService {
  constructor(
    @Inject(AuthInfoServiceConfig)
    private readonly config: AuthInfoServiceConfig
  ) {}

  getAuthInfo(): AuthInfoDto {
    const dto = new AuthInfoDto()
    dto.wellKnownConfigUrl = this.config.wellKnownConfigUrl
    return dto
  }
}
