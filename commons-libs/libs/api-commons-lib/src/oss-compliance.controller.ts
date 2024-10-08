import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common'
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger'
import { Response } from 'express'
import { validateName } from './input-validator'
import { OSSComplianceService } from './oss-compliance.service'
import { Public } from './public-decorator'

function completeResponseData(
  response: Response,
  filename: string,
  content: Buffer,
): StreamableFile {
  response.header('Content-Disposition', `attachment; filename="${filename}"`)
  return new StreamableFile(content)
}

@Controller('oss')
@ApiTags('Status')
export class OSSComplianceController {
  constructor(readonly service: OSSComplianceService) {}

  @Public()
  @Get('sbom')
  @ApiOperation({
    summary:
      'Returns an sbom referencing all oss components used in the service with the necessary attribution data',
  })
  @ApiOkResponse({
    description: 'CycloneDX SBOM as application/octet-stream',
  })
  @ApiProduces('application/octet-stream')
  async getOSSComplianceInfo(
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const fileBuffer = await this.service.getSBOM()
    return completeResponseData(
      response,
      this.service.getSBOMFilename(),
      fileBuffer,
    )
  }
}

class ComponentList {
  @ApiProperty({
    description:
      'A list of oss component names, for which source code can be retrieved from the service',
    type: 'string',
    isArray: true,
  })
  components: string[]
}

function toComponentList(components: string[]): ComponentList {
  const list = new ComponentList()
  list.components = components
  return list
}

export class OSSSourceController extends OSSComplianceController {
  constructor(service: OSSComplianceService) {
    super(service)
  }

  @Public()
  @Get('sources')
  @ApiOperation({
    summary:
      'Returns a list of oss components for which the licenses requires source code to be distributed',
  })
  @ApiOkResponse({
    description:
      'A list of oss component names for which source code is available',
    type: ComponentList,
  })
  @ApiProduces('application/json')
  getOSSComponentList(): ComponentList {
    const components = this.service.getComponentsWithSources()
    return toComponentList(components)
  }

  @Public()
  @Get('sources/:name')
  @ApiOperation({
    summary:
      'Return the source code of the requested oss component as zip file',
  })
  @ApiOkResponse({ description: 'The sources as zipped stream' })
  @ApiNotFoundResponse({
    description:
      'The component requested with the given name is not found, perhaps no source code needs to be distributed or the component is not used at all',
  })
  @ApiProduces('application/octet-stream')
  async getSourceOfOSSComponent(
    @Param('name') name: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    validateName(name)
    const sourcefile = await this.service.getSourceForComponent(name)
    return completeResponseData(
      response,
      sourcefile.filename,
      sourcefile.content,
    )
  }
}
