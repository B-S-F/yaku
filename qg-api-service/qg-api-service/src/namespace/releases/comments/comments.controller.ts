import {
  createPaginationData,
  queryOptionsSchema,
  SortOrder,
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
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Request, Response } from 'express'
import { getUserFromRequest } from '../../module.utils'
import { CommentsService } from './comments.service'
import {
  AddCommentDto,
  addCommentDtoSchema,
  allowedSortProperties,
  CommentByReferenceListDto,
  CommentDto,
  CommentsByReferenceDto,
  CommentsByReferenceQueryOptions,
  CommentsQueryOptions,
  CommentWithRepliesAndReferenceDto,
  CommentWithRepliesDto,
  Reference,
  ReferenceApiProperty,
  referenceSchema,
  UpdateCommentDto,
  updateCommentDtoSchema,
} from './comments.utils'

@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@ApiTags('Releases')
@Controller('namespaces/:namespaceId/releases/:releaseId/comments')
export class CommentsController {
  constructor(
    @Inject(CommentsService) private readonly service: CommentsService,
    @Inject(UrlHandlerFactory) private readonly urlHandler: UrlHandlerFactory
  ) {}

  // TODO: This will be replaced by the History Endpoint, remove it after UI is updated
  @Get()
  @ApiOperation({
    summary: 'Get comments of the release',
  })
  @ApiOkResponse({
    type: CommentByReferenceListDto,
    description: 'List of root comments with their replies',
  })
  async getComments(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Query() queryOptions: CommentsQueryOptions,
    @Res({ passthrough: true }) response: Response
  ): Promise<CommentByReferenceListDto> {
    validateId(namespaceId)
    validateId(releaseId)

    const listQueryOptions = toListQueryOptions(
      queryOptions,
      queryOptionsSchema.strict(),
      allowedSortProperties,
      'id'
    )
    const requestUrl = this.urlHandler.getHandler(response)

    const comments = await this.service.list(
      namespaceId,
      releaseId,
      listQueryOptions
    )

    return createPaginationData<
      CommentWithRepliesAndReferenceDto,
      CommentByReferenceListDto
    >(listQueryOptions, requestUrl, comments.itemCount, comments.entities)
  }

  @Get(':commentId')
  @ApiOperation({
    summary: 'Get a comment of the release',
  })
  @ApiOkResponse({ description: 'Comment' })
  async getComment(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('commentId') commentId: number
  ): Promise<CommentDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(commentId)

    return this.service.get(namespaceId, releaseId, commentId)
  }

  @Post('')
  @ApiOperation({
    summary: 'Add a comment to the release',
  })
  @ApiCreatedResponse({ type: CommentDto, description: 'Comment added' })
  async addComment(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Body() body: AddCommentDto,
    @Req() request: Request
  ): Promise<CommentDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateBody(body, addCommentDtoSchema)

    const user = getUserFromRequest(request)
    return await this.service.create(
      namespaceId,
      releaseId,
      body.reference,
      body.content,
      body.todo,
      user
    )
  }

  @Post('get-by-reference')
  @ApiOperation({
    summary: 'Get comments by reference',
  })
  @ApiOkResponse({ type: CommentsByReferenceDto })
  @ApiBody({
    schema: {
      oneOf: ReferenceApiProperty,
    },
    examples: {
      check: {
        value: {
          type: 'check',
          chapter: '1',
          requirement: '1',
          check: '1',
        },
      },
      comment: {
        value: {
          type: 'comment',
          id: 1,
        },
      },
      release: {
        value: {
          type: 'release',
        },
      },
    },
  })
  @HttpCode(200)
  async getCommentsByReference(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Query() queryOptions: CommentsByReferenceQueryOptions,
    @Body() body: Reference
  ): Promise<CommentsByReferenceDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateBody(body, referenceSchema)

    return this.service.getByReference(
      namespaceId,
      releaseId,
      body,
      queryOptions.sortOrder as SortOrder
    )
  }

  @Post(':commentId/resolve')
  @ApiOperation({
    summary: 'Resolve a comment',
  })
  @ApiOkResponse({ description: 'Comment resolved' })
  @HttpCode(200)
  async resolveComment(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('commentId') commentId: number,
    @Req() request: Request
  ): Promise<void> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(commentId)

    const user = getUserFromRequest(request)
    return this.service.resolve(namespaceId, releaseId, commentId, user)
  }

  @Post(':commentId/reset')
  @ApiOperation({
    summary: 'Reset a comment',
  })
  @ApiOkResponse({ description: 'Comment reset' })
  @HttpCode(200)
  async resetResolveComment(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('commentId') commentId: number,
    @Req() request: Request
  ): Promise<void> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(commentId)

    const user = getUserFromRequest(request)
    return this.service.reset(namespaceId, releaseId, commentId, user)
  }

  @Patch(':commentId')
  @ApiOperation({
    summary: 'Update a comment',
  })
  @ApiOkResponse({ type: CommentDto, description: 'Comment updated' })
  async updateComment(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('commentId') commentId: number,
    @Body() body: UpdateCommentDto,
    @Req() request: Request
  ): Promise<CommentDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(commentId)
    validateBody(body, updateCommentDtoSchema)

    const user = getUserFromRequest(request)
    return this.service.update(
      namespaceId,
      releaseId,
      commentId,
      body.content,
      user
    )
  }

  @Delete(':commentId')
  @ApiOperation({
    summary: 'Remove a comment from the release',
  })
  @ApiOkResponse({ description: 'Comment removed' })
  async removeComment(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('commentId') commentId: number,
    @Req() request: Request
  ): Promise<void> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(commentId)

    const user = getUserFromRequest(request)
    return this.service.remove(namespaceId, releaseId, commentId, user)
  }
}
