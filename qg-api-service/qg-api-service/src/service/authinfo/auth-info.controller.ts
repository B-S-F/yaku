import { Public } from '@B-S-F/api-commons-lib'
import { Controller, Get, Inject } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthInfoDto, AuthInfoService } from './auth-info.service'

@Controller('authinfo')
@ApiTags('Info about authentication and authorization configuration')
export class AuthInfoController {
  constructor(
    @Inject(AuthInfoService) private readonly service: AuthInfoService
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Retrieve the .well-known configuration URL of the OpenID Connect endpoints',
  })
  @Public()
  @ApiOkResponse({
    type: AuthInfoDto,
    description:
      'The .well-known configuration URL of the OpenID Connect endpoints',
  })
  getAuthInfo(): AuthInfoDto {
    return this.service.getAuthInfo()
  }
}
