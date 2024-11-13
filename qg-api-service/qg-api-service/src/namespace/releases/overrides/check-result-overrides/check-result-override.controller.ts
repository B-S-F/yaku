import {
  UrlHandlerFactory,
  validateBody,
  validateId,
} from '@B-S-F/api-commons-lib'
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Request } from 'express'
import { QueryFailedError } from 'typeorm'
import { getUserFromRequest } from '../../../../namespace/module.utils'
import { CheckResultOverrideAuthGuard } from './check-result-override.auth.guard'
import { CheckResultOverridesService } from './check-result-override.service'
import {
  AddCheckResultOverrideDto,
  addCheckResultOverrideDtoSchema,
  CheckResultOverrideDto,
  RESULT_OVERRIDE_UNIQUE_PER_RELEASE_CONTRAINT,
  UpdateCheckResultOverrideDto,
  updateCheckResultOverrideDtoSchema,
} from './check-result-override.utils'

@UseGuards(CheckResultOverrideAuthGuard)
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@ApiTags('Releases')
@Controller('namespaces/:namespaceId/releases/:releaseId/resultOverrides')
export class CheckResultOverridesController {
  constructor(
    @Inject(CheckResultOverridesService)
    private readonly service: CheckResultOverridesService,
    @Inject(UrlHandlerFactory) private readonly urlHandler: UrlHandlerFactory
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Override a check results fulfilled property for this release',
  })
  @ApiCreatedResponse({ description: 'Override added' })
  async createOverride(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Body() body: AddCheckResultOverrideDto,
    @Req() request: Request
  ): Promise<CheckResultOverrideDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateBody(body, addCheckResultOverrideDtoSchema)
    const actor = getUserFromRequest(request)

    try {
      return await this.service.create(
        namespaceId,
        releaseId,
        body.reference.chapter,
        body.reference.requirement,
        body.reference.check,
        body.reference.hash,
        body.originalFulfilled,
        body.manualFulfilled,
        body.comment,
        actor
      )
    } catch (e) {
      if (e.name === QueryFailedError.name) {
        const err = e as QueryFailedError
        if (err.message.includes('violates foreign key constraint')) {
          throw new NotFoundException(
            `Release not found, namespace: ${namespaceId}, release: ${releaseId}`
          )
        } else if (
          err.message.includes(RESULT_OVERRIDE_UNIQUE_PER_RELEASE_CONTRAINT)
        ) {
          throw new BadRequestException(
            `Override already present, namespace: ${namespaceId}, release: ${releaseId}, chapter: ${body.reference.chapter}, requirement: ${body.reference.requirement}, check: ${body.reference.check}, hash: ${body.reference.hash}`
          )
        }
      }
      throw e
    }
  }

  @Patch('/:overrideId')
  @ApiOperation({
    summary: 'Update an override for a check results fulfilled property',
  })
  @ApiOkResponse({ description: 'Override modified' })
  @HttpCode(200)
  async updateOverride(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('overrideId') overrideId: number,
    @Body() body: UpdateCheckResultOverrideDto,
    @Req() request: Request
  ): Promise<CheckResultOverrideDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(overrideId)
    validateBody(body, updateCheckResultOverrideDtoSchema)
    const actor = getUserFromRequest(request)

    return await this.service.update(
      namespaceId,
      releaseId,
      overrideId,
      body.originalFulfilled,
      body.manualFulfilled,
      body.comment,
      actor
    )
  }

  @Get()
  @ApiOperation({
    summary: 'Returns all check result overrides for a release',
  })
  @ApiOkResponse({
    description: 'All check result overrides for the release provided',
  })
  async getAllOverrides(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number
  ): Promise<CheckResultOverrideDto[]> {
    return await this.service.getAll(namespaceId, releaseId)
  }

  @Delete('/:overrideId')
  @ApiOperation({
    summary: 'Delete an override for a check results fulfilled property',
  })
  @ApiOkResponse({ description: 'Override deleted' })
  @HttpCode(200)
  async removeOverride(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('overrideId') overrideId: number,
    @Req() request: Request
  ): Promise<void> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(overrideId)
    const actor = getUserFromRequest(request)

    return await this.service.remove(namespaceId, releaseId, overrideId, actor)
  }
}
