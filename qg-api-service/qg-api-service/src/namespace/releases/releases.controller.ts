import {
  createPaginationData,
  PaginationQueryOptions,
  queryOptionsSchema,
  toListQueryOptions,
  UrlHandlerFactory,
  validateBody,
  validateId,
} from '@B-S-F/api-commons-lib'
import {
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
  Query,
  Req,
  Res,
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
import { Request, Response } from 'express'
import { QueryFailedError } from 'typeorm'
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError'
import { getUserFromRequest } from '../module.utils'
import { HistoryService } from './history.service'
import {
  HistoryDto,
  HistoryQueryOptions,
  historyQueryOptionsSchema,
} from './history.utils'
import { ReleasesService } from './releases.service'
import {
  AddReleaseDto,
  addReleaseDtoSchema,
  AggregateApprovalDto,
  allowedSortProperties,
  ReleaseDto,
  ReleaseListDto,
  UpdateReleaseDto,
  updateReleaseDtoSchema,
} from './releases.utils'

@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@ApiTags('Releases')
@Controller('namespaces/:namespaceId/releases')
export class ReleasesController {
  constructor(
    @Inject(ReleasesService) private readonly service: ReleasesService,
    @Inject(HistoryService) private readonly historyService: HistoryService,
    @Inject(UrlHandlerFactory) private readonly urlHandler: UrlHandlerFactory
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve all releases',
  })
  @ApiOkResponse({
    description: 'List of releases',
    type: ReleaseListDto,
  })
  async getReleases(
    @Param('namespaceId') namespaceId: number,
    @Query() queryOptions: PaginationQueryOptions,
    @Res({ passthrough: true }) response: Response
  ): Promise<ReleaseListDto> {
    validateId(namespaceId)
    const listQueryOptions = toListQueryOptions(
      queryOptions,
      queryOptionsSchema.strict(),
      allowedSortProperties,
      'id'
    )

    const requestUrl = this.urlHandler.getHandler(response)
    const releases = await this.service.list(namespaceId, listQueryOptions)

    return createPaginationData<ReleaseDto, ReleaseListDto>(
      listQueryOptions,
      requestUrl,
      releases.itemCount,
      releases.entities
    )
  }

  @Get('/:releaseId')
  @ApiOperation({
    summary: 'Retrieve a release',
  })
  @ApiOkResponse({
    type: ReleaseDto,
  })
  async getRelease(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number
  ): Promise<ReleaseDto> {
    validateId(namespaceId)
    validateId(releaseId)

    try {
      return await this.service.get(namespaceId, releaseId)
    } catch (e) {
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(`Release not found, id: ${releaseId}`)
      }
      throw e
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Add a new release',
  })
  @ApiCreatedResponse({ type: ReleaseDto })
  async create(
    @Param('namespaceId') namespaceId: number,
    @Body() body: AddReleaseDto,
    @Req() request: Request
  ): Promise<ReleaseDto> {
    validateId(namespaceId)
    validateBody(body, addReleaseDtoSchema)

    const user = getUserFromRequest(request)
    try {
      return await this.service.create(
        namespaceId,
        body.name,
        body.approvalMode,
        body.qgConfigId,
        body.plannedDate,
        user
      )
    } catch (e) {
      if (e.name === QueryFailedError.name) {
        if (e.message.includes('violates foreign key constraint')) {
          throw new NotFoundException(
            `Config not found, qgConfigId: ${body.qgConfigId}`
          )
        }
      }
      throw e
    }
  }

  @Patch('/:releaseId')
  @ApiOperation({
    summary: 'Update a release',
  })
  @ApiOkResponse({ type: ReleaseDto })
  async update(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Body() body: UpdateReleaseDto,
    @Req() request: Request
  ): Promise<ReleaseDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateBody(body, updateReleaseDtoSchema)

    const user = getUserFromRequest(request)

    try {
      return await this.service.update(
        namespaceId,
        releaseId,
        user,
        body.name,
        body.approvalMode,
        body.plannedDate
      )
    } catch (e) {
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(`Release not found, id: ${releaseId}`)
      }
      throw e
    }
  }

  @Delete('/:releaseId')
  @ApiOperation({
    summary: 'Delete a release',
  })
  @ApiOkResponse({ description: 'Release removed' })
  async removeRelease(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Req() request: Request
  ): Promise<void> {
    validateId(namespaceId)
    validateId(releaseId)

    const user = getUserFromRequest(request)

    try {
      return await this.service.remove(namespaceId, releaseId, user)
    } catch (e) {
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(`Release not found, id: ${releaseId}`)
      }
      throw e
    }
  }

  @Get('/:releaseId/state')
  @ApiOperation({
    summary: 'Get aggregate approval state of the release',
  })
  @ApiOkResponse({
    description: 'Aggregate approval state of the release',
    type: AggregateApprovalDto,
  })
  async getAggregateState(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number
  ): Promise<AggregateApprovalDto> {
    validateId(namespaceId)
    validateId(releaseId)

    try {
      const dto = await this.service.getApprovalState(namespaceId, releaseId)
      return dto
    } catch (e) {
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(
          `Release not found, namespace: ${namespaceId}, release: ${releaseId}`
        )
      }
      throw e
    }
  }

  @Post('/:releaseId/close')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Close the release',
    description:
      'The release cannot be modified anymore. Closing is not reversible',
  })
  @ApiOkResponse({
    description: 'Release has been closed',
  })
  async close(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Req() request: Request
  ): Promise<void> {
    validateId(namespaceId)
    validateId(releaseId)

    const user = getUserFromRequest(request)

    try {
      await this.service.close(namespaceId, releaseId, user)
    } catch (e) {
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(
          `Release not found, namespace: ${namespaceId}, release: ${releaseId}`
        )
      }
      throw e
    }
  }

  @Get('/:releaseId/history')
  @ApiOperation({ summary: 'Get release history' })
  @ApiOkResponse({
    type: HistoryDto,
  })
  async getReleaseHistory(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Query() queryOptions: HistoryQueryOptions,
    @Res({ passthrough: true }) response: Response
  ): Promise<HistoryDto> {
    validateId(namespaceId)
    validateId(releaseId)
    if (queryOptions.items) {
      queryOptions.items = Number(queryOptions.items)
    }
    if (queryOptions.lastTimestamp) {
      queryOptions.lastTimestamp = Number(queryOptions.lastTimestamp)
    }
    validateBody(queryOptions, historyQueryOptionsSchema)
    if (!queryOptions.items) {
      queryOptions.items = 20
    }
    const requestUrl = this.urlHandler.getHandler(response)
    return this.historyService.getReleaseHistory(
      namespaceId,
      releaseId,
      queryOptions,
      requestUrl
    )
  }
}
