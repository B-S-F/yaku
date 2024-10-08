import {
  UrlHandlerFactory,
  validateId,
  validateBody,
} from '@B-S-F/api-commons-lib'
import {
  Controller,
  Inject,
  Post,
  Param,
  Req,
  NotFoundException,
  BadRequestException,
  Body,
  Delete,
  HttpCode,
  Patch,
  Get,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOAuth2,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger'
import { getUserFromRequest } from '../../module.utils'
import { Request } from 'express'
import { QueryFailedError } from 'typeorm'
import {
  AddOverrideDto,
  OVERRIDE_UNIQUE_PER_RELEASE_CONSTRAINT,
  OverrideDto,
  UpdateOverrideDto,
  addOverrideDtoSchema,
  updateOverrideDtoSchema,
} from './overrides.utils'
import { OverridesService } from './overrides.service'
import { OverrideAuthGuard } from './override.auth.guard'

@UseGuards(OverrideAuthGuard)
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@ApiTags('Releases')
@Controller('namespaces/:namespaceId/releases/:releaseId/overrides')
export class OverridesController {
  constructor(
    @Inject(OverridesService) private readonly service: OverridesService,
    @Inject(UrlHandlerFactory) private readonly urlHandler: UrlHandlerFactory
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Override a check result for this release',
  })
  @ApiCreatedResponse({ description: 'Override added' })
  async createOverride(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Body() body: AddOverrideDto,
    @Req() request: Request
  ): Promise<OverrideDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateBody(body, addOverrideDtoSchema)
    const actor = getUserFromRequest(request)

    try {
      return await this.service.create(
        namespaceId,
        releaseId,
        body.reference.chapter,
        body.reference.requirement,
        body.reference.check,
        body.originalColor,
        body.manualColor,
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
          err.message.includes(OVERRIDE_UNIQUE_PER_RELEASE_CONSTRAINT)
        ) {
          throw new BadRequestException(
            `Override already present, namespace: ${namespaceId}, release: ${releaseId}, chapter: ${body.reference.chapter}, requirement: ${body.reference.requirement}, check: ${body.reference.check}`
          )
        }
      }
      throw e
    }
  }

  @Patch('/:overrideId')
  @ApiOperation({
    summary: 'Update an override for a check result',
  })
  @ApiOkResponse({ description: 'Override modified' })
  @HttpCode(200)
  async updateOverride(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('overrideId') overrideId: number,
    @Body() body: UpdateOverrideDto,
    @Req() request: Request
  ): Promise<OverrideDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(overrideId)
    validateBody(body, updateOverrideDtoSchema)
    const actor = getUserFromRequest(request)

    return await this.service.update(
      namespaceId,
      releaseId,
      overrideId,
      body.originalColor,
      body.manualColor,
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
  ): Promise<OverrideDto[]> {
    return await this.service.getAll(namespaceId, releaseId)
  }

  @Delete('/:overrideId')
  @ApiOperation({
    summary: 'Delete an override for a check result',
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
