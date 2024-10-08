import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiExcludeController,
  ApiForbiddenResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { ExplanationsService } from './explanations.service'
import { ENABLE_EXPLANATIONS_FEATURE } from './../../config'
import { validateId } from '@B-S-F/api-commons-lib'

class ExplanationsQueryOptions {
  @ApiProperty({
    description: `Id of the run.`,
    type: 'number',
    example: '1',
  })
  runId: number

  @ApiProperty({
    description: `The selected chapter.`,
    type: 'string',
    example: '1',
  })
  chapter: string

  @ApiProperty({
    description: `The selected requirement.`,
    type: 'string',
    example: '1',
  })
  requirement: string

  @ApiProperty({
    description: `The selected check.`,
    type: 'string',
    example: '1',
  })
  check: string
}

class ExplanationsDto {
  @ApiProperty({
    description: `Explanation for the autopilot`,
    type: 'string',
    example: 'This autopilot is used to evaluate json',
  })
  explanation: string
}

@ApiExcludeController(ENABLE_EXPLANATIONS_FEATURE != 'true')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@ApiTags('Autopilot Explainer')
@Controller(':namespaceId/explainer')
export class ExplanationsController {
  constructor(
    @Inject(ExplanationsService)
    readonly explanationsService: ExplanationsService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get explanation for autopilot',
  })
  @ApiOkResponse({
    description: 'Explainer response',
    type: String,
  })
  async getExplanation(
    @Param('namespaceId') namespaceId: number,
    @Query() queryOptions: ExplanationsQueryOptions
  ): Promise<ExplanationsDto> {
    validateId(namespaceId)
    validateId(queryOptions.runId)

    const explanation = await this.explanationsService.getExplanation(
      namespaceId,
      queryOptions.runId,
      queryOptions.chapter,
      queryOptions.requirement,
      queryOptions.check
    )
    return { explanation }
  }
}
