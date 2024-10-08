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
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Request, Response } from 'express'
import { getUserFromRequest } from '../../namespace/module.utils'
import { EntityNotFoundError } from 'typeorm'
import { InteractiveLoginGuard } from './interactive.login.guard'
import { LongRunningTokenService } from './long.running.token.service'
import {
  CreateTokenRequestDto,
  CreateTokenResponseDto,
  GetTokenResponseDto,
  TokenListDto,
  allowedSortProperties,
  createTokenRequestDtoSchema,
} from './long.running.token.utils'

@Controller('long-running-tokens')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTags('Tokens')
export class LongRunningTokenController {
  constructor(
    @Inject(LongRunningTokenService) readonly service: LongRunningTokenService,
    @Inject(UrlHandlerFactory) private readonly urlHandler: UrlHandlerFactory
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve meta data about all the tokens of the calling user',
    description:
      'The response does not contain the token values as the service does not know the values.',
  })
  @ApiOkResponse({
    type: GetTokenResponseDto,
  })
  @HttpCode(200)
  async list(
    @Req() request: Request,
    @Query() queryOptions: PaginationQueryOptions,
    @Res({ passthrough: true }) response: Response
  ): Promise<TokenListDto> {
    const user = getUserFromRequest(request)

    const listQueryOptions = toListQueryOptions(
      queryOptions,
      queryOptionsSchema.strict(),
      allowedSortProperties,
      'id'
    )

    const requestUrl = this.urlHandler.getHandler(response)
    const dtosWithCount = await this.service.list(user, listQueryOptions)

    return createPaginationData<GetTokenResponseDto, TokenListDto>(
      listQueryOptions,
      requestUrl,
      dtosWithCount.itemCount,
      dtosWithCount.dtos
    )
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve meta data about a token',
    description:
      'The response does not contain the token value as the service does not know the value.',
  })
  @ApiOkResponse({
    type: GetTokenResponseDto,
  })
  @HttpCode(200)
  async get(
    @Param('id') id: number,
    @Req() request: Request
  ): Promise<GetTokenResponseDto> {
    validateId(id)
    const user = getUserFromRequest(request)
    try {
      return await this.service.get(id, user)
    } catch (e) {
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(`Token not found for user, id: ${id}`)
      }
      throw e
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new token',
    description: 'The new token is active.',
  })
  @ApiCreatedResponse({
    type: CreateTokenResponseDto,
  })
  @UseGuards(InteractiveLoginGuard)
  async create(
    @Body() body: CreateTokenRequestDto,
    @Req() request: Request
  ): Promise<CreateTokenResponseDto> {
    validateBody(body, createTokenRequestDtoSchema)
    const user = getUserFromRequest(request)
    const try_admin = body.try_admin === undefined ? false : body.try_admin
    return await this.service.create(body.description, try_admin, user)
  }

  @Post(':id/revoke')
  @ApiOperation({
    summary: 'Revoke an existing token',
    description: 'The token is revoked and can never be used again.',
  })
  @ApiOkResponse({})
  @HttpCode(200)
  async revoke(
    @Param('id') id: number,
    @Req() request: Request
  ): Promise<void> {
    validateId(id)
    const user = getUserFromRequest(request)
    try {
      await this.service.revoke(id, user)
    } catch (e) {
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(`Token not found for user, id: ${id}`)
      }
      throw e
    }
  }
}
