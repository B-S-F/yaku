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
import { getUserFromRequest } from '../../module.utils'
import { OverrideAuthGuard } from './override.auth.guard'
import { OverridesService } from './overrides.service'
import {
  AddOverrideDto,
  OVERRIDE_UNIQUE_PER_RELEASE_CONSTRAINT,
  OverrideDto,
  UpdateOverrideDto,
  addOverrideDtoSchema,
  updateOverrideDtoSchema,
} from './overrides.utils'

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
    summary: "Override a check's status color for this release",
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
    summary: "Update an override for a check's status color",
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
    summary: 'Returns all check status color overrides for a release',
  })
  @ApiOkResponse({
    description: 'All check status color overrides for the release provided',
  })
  async getAllOverrides(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number
  ): Promise<OverrideDto[]> {
    return await this.service.getAll(namespaceId, releaseId)
  }

  @Delete('/:overrideId')
  @ApiOperation({
    summary: "Delete an override for a check's status color",
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
