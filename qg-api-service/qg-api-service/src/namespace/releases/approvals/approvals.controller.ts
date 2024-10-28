import {
  PaginationQueryOptions,
  UrlHandlerFactory,
  createPaginationData,
  queryOptionsSchema,
  toListQueryOptions,
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
import { EntityNotFoundError, QueryFailedError } from 'typeorm'
import { getUserFromRequest } from '../../module.utils'
import { ApprovalService } from './approvals.service'
import {
  APPROVER_UNIQUE_PER_RELEASE_CONSTRAINT,
  AddApproverDto,
  ApprovalDto,
  ApprovalListDto,
  UpdateApprovalDto,
  addApproverDtoSchema,
  allowedSortPropertiesApprovalList,
  updateApprovalDtoSchema,
} from './approvals.util'

@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@ApiTags('Releases')
@Controller('namespaces/:namespaceId/releases/:releaseId')
export class ApprovalController {
  constructor(
    @Inject(ApprovalService) private readonly service: ApprovalService,
    @Inject(UrlHandlerFactory) private readonly urlHandler: UrlHandlerFactory
  ) {}

  @Post('/approvers')
  @ApiOperation({
    summary: 'Add an approver to the release',
  })
  @ApiCreatedResponse({ description: 'Approver added' })
  async addApprover(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Body() body: AddApproverDto,
    @Req() request: Request
  ): Promise<ApprovalDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateBody(body, addApproverDtoSchema)
    const actor = getUserFromRequest(request)

    try {
      return await this.service.addApprover(
        namespaceId,
        releaseId,
        body.user,
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
          err.message.includes(APPROVER_UNIQUE_PER_RELEASE_CONSTRAINT)
        ) {
          throw new BadRequestException(
            `Approver already present: ${namespaceId}, release: ${releaseId}, approver: ${body.user}`
          )
        }
      }
      throw e
    }
  }

  @Post('/approve')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Approve a release',
  })
  @ApiOkResponse({ description: 'Release approved' })
  async approveRelease(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Body() body: UpdateApprovalDto,
    @Req() request: Request
  ): Promise<void> {
    validateId(namespaceId)
    validateId(releaseId)
    validateBody(body, updateApprovalDtoSchema)
    const actor = getUserFromRequest(request)
    try {
      return await this.service.approve(
        namespaceId,
        releaseId,
        body.comment,
        actor
      )
    } catch (e) {
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(
          `Approver or release do not exist, namespace:${namespaceId}, release: ${releaseId}, approver:${actor.id}`
        )
      }
      throw e
    }
  }

  @Post('/reset')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Reset your approval',
  })
  @ApiOkResponse({ description: 'Approval reset' })
  async resetApproval(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Body() body: UpdateApprovalDto,
    @Req() request: Request
  ): Promise<void> {
    validateId(namespaceId)
    validateId(releaseId)
    validateBody(body, updateApprovalDtoSchema)
    const actor = getUserFromRequest(request)
    try {
      return await this.service.reset(
        namespaceId,
        releaseId,
        body.comment,
        actor
      )
    } catch (e) {
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(
          `Approver or release do not exist, namespace:${namespaceId}, release: ${releaseId}, approver:${actor.id}`
        )
      }
      throw e
    }
  }

  @Get('/approvers/:approverId')
  @ApiOperation({
    summary: 'Get an approver',
  })
  @ApiOkResponse({ description: 'Approver returned', type: ApprovalDto })
  async getApprover(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('approverId') approverId: number
  ): Promise<ApprovalDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(approverId)
    try {
      return await this.service.get(namespaceId, releaseId, approverId)
    } catch (e) {
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(
          `Approver not found, namespace: ${namespaceId}, release: ${releaseId}, approver: ${approverId}`
        )
      }
      throw e
    }
  }

  @Get('/approvers')
  @ApiOperation({
    summary: 'Get approval state of all approvers',
  })
  @ApiOkResponse({
    description: 'List of approvals',
    type: ApprovalListDto,
  })
  async getApprovals(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Query() queryOptions: PaginationQueryOptions,
    @Res({ passthrough: true }) response: Response
  ): Promise<ApprovalListDto> {
    validateId(namespaceId)
    validateId(releaseId)
    const listQueryOptions = toListQueryOptions(
      queryOptions,
      queryOptionsSchema.strict(),
      allowedSortPropertiesApprovalList,
      'id'
    )
    const requestUrl = this.urlHandler.getHandler(response)

    const releases = await this.service.list(
      namespaceId,
      releaseId,
      listQueryOptions
    )

    return createPaginationData<ApprovalDto, ApprovalListDto>(
      listQueryOptions,
      requestUrl,
      releases.itemCount,
      releases.entities
    )
  }

  @Delete('/approvers/:approverId')
  @ApiOperation({
    summary: 'Remove an approver from the release',
  })
  @ApiOkResponse({ description: 'Approver removed' })
  async removeApprover(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('approverId') approverId: number,
    @Req() request: Request
  ): Promise<void> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(approverId)
    const actor = getUserFromRequest(request)
    return await this.service.remove(namespaceId, releaseId, approverId, actor)
  }
}
