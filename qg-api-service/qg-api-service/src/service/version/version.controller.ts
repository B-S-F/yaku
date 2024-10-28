import { Public } from '@B-S-F/api-commons-lib'
import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { VersionInformation, VersionService } from './version.service'

@Controller('info')
@ApiTags('Status')
export class VersionController {
  constructor(private readonly service: VersionService) {}

  @Get()
  @ApiOperation({
    summary:
      'Retrieve information on current versions used to operate the service. It returns the version of the service, of the surrounding docker container and the versions of the workflow image used to execute runs.',
  })
  @Public()
  @ApiOkResponse({
    type: VersionInformation,
    description: 'The version information from the operated service',
  })
  getVersionInfo(): VersionInformation {
    return this.service.getVersion()
  }
}
