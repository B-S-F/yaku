import {
  createPaginationData,
  ListQueryHandler,
  toListQueryOptions,
  UrlHandlerFactory,
} from '@B-S-F/api-commons-lib'
import { Controller, Get, Inject, Param, Query, Res } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Response } from 'express'
import { UsersService } from './users.service'
import {
  allowedSortProperties,
  queryOptionsSchema,
  UserInNamespaceDto,
  UserInNamespaceListDto,
  UserInNamespaceQueryOptions,
} from './users.utils'

@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@ApiTags('Namespaces')
@Controller('namespaces/:namespaceId/users')
export class UsersController {
  constructor(
    @Inject(UrlHandlerFactory) private readonly urlHandler: UrlHandlerFactory,
    @Inject(UsersService) private readonly service: UsersService
  ) {}

  @Get('')
  @ApiOperation({
    summary: 'Retrieve users with access to the namespace',
  })
  @ApiOkResponse({
    type: UserInNamespaceListDto,
    description: 'List of users with access to the namespace',
  })
  async list(
    @Param('namespaceId') namespaceId: number,
    @Query() queryOptions: UserInNamespaceQueryOptions,
    @Res({ passthrough: true }) response: Response
  ): Promise<UserInNamespaceListDto> {
    const listQueryOptions: ListQueryHandler = toListQueryOptions(
      queryOptions,
      queryOptionsSchema.strict(),
      allowedSortProperties as any,
      'id'
    )
    const requestUrl = this.urlHandler.getHandler(response)
    const data = await this.service.listWithQueryOptions(
      namespaceId,
      listQueryOptions.page,
      listQueryOptions.items,
      queryOptions.sortBy,
      queryOptions.sortOrder,
      queryOptions.search
    )

    return createPaginationData<UserInNamespaceDto, UserInNamespaceListDto>(
      listQueryOptions,
      requestUrl,
      data.itemCount,
      data.entities
    )
  }
}
