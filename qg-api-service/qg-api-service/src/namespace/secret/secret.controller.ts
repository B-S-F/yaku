import {
  PaginatedData,
  PaginationQueryOptions,
  UrlHandlerFactory,
  createPaginationData,
  queryOptionsSchema,
  toListQueryOptions,
  validateBody,
  validateName,
  validateId,
} from '@B-S-F/api-commons-lib'
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiUnauthorizedResponse,
  OmitType,
  PartialType,
} from '@nestjs/swagger'
import { Response } from 'express'
import { z } from 'zod'
import { Secret } from './secret.entity'
import { SecretService } from './secret.service'

class SecretMetadataDto {
  @ApiProperty({
    description: 'Name of the secret, secret will be referenced by this name',
    example: 'MY_SECRET',
    type: 'string',
  })
  name: string

  @ApiPropertyOptional({
    description: 'Optional description to document purpose of secret',
    example: 'Api token for accessing service X',
    type: 'string',
  })
  description?: string | null

  @ApiProperty({
    description: 'Creation time of the secret resource',
    example: '2022-10-21 12:12:30.000',
  })
  creationTime: Date

  @ApiProperty({
    description: 'Last Modification time of the secret resource',
    example: '2022-10-21 12:12:30.000',
  })
  lastModificationTime: Date
}

function toOutputDto(secret: Secret) {
  const dto = new SecretMetadataDto()
  dto.name = secret.name
  if (secret.description) {
    dto.description = secret.description
  }
  dto.creationTime = secret.creationTime
  dto.lastModificationTime = secret.lastModificationTime
  return dto
}

class SecretPostDto extends OmitType(SecretMetadataDto, [
  'creationTime',
  'lastModificationTime',
]) {
  @ApiProperty({
    description:
      'Value of the secret. This will be forwarded to qg runs in this namespace.',
    example: 'R3JlYXQgU2VjcmV0IG5vLW9uZSBldmVyIHdpbGwgZmluZCBvdXQ',
    type: 'string',
  })
  secret: string
}

const postSchema = z
  .object({
    name: z.string().trim().min(1),
    description: z.string().optional(),
    secret: z.string().trim().min(1),
  })
  .strict()

class SecretPatchDto extends PartialType(OmitType(SecretPostDto, ['name'])) {}

const patchSchema = z
  .object({
    description: z.union([z.string(), z.null()]).optional(),
    secret: z.string().optional(),
  })
  .strict()
  .refine(
    (value) => Boolean(value.description?.trim() || value.secret?.trim()),
    {
      message: `At least one of the properties 'description' or 'secret' must be set.`,
    }
  )

class SecretListDto extends PaginatedData {
  @ApiProperty({
    description: 'Secrets of the returned page',
    type: SecretMetadataDto,
    isArray: true,
  })
  data: SecretMetadataDto[]
}

const allowedSortProperties = ['name', 'creationTime', 'lastModificationTime']

class SecretsQueryOptions extends PaginationQueryOptions {
  @ApiPropertyOptional({
    description: `Sort secrets by the given property, allowed properties are ${allowedSortProperties}`,
    type: 'string',
    example: 'name',
    default: 'name',
  })
  sortBy?: string
}

@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@ApiTags('Secrets')
@Controller(':namespaceId/secrets')
export class SecretController {
  constructor(
    @Inject(SecretService) readonly service: SecretService,
    @Inject(UrlHandlerFactory) private readonly urlHandler: UrlHandlerFactory
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Retrieve secrets known to the given namespace as paged data, contains only the metadata, not the secrets. The api does not allow to retrieve secret values at all.',
  })
  @ApiOkResponse({
    description: 'Requested page of secrets of the namespace',
    type: SecretMetadataDto,
    isArray: true,
  })
  async getSecrets(
    @Param('namespaceId') namespaceId: number,
    @Query() queryOptions: SecretsQueryOptions,
    @Res({ passthrough: true }) response: Response
  ): Promise<SecretListDto> {
    validateId(namespaceId)

    const listQueryOptions = toListQueryOptions(
      queryOptions,
      queryOptionsSchema.strict(),
      allowedSortProperties,
      'id'
    )
    const requestUrl = this.urlHandler.getHandler(response)

    const rawData = await this.service.getSecrets(namespaceId, listQueryOptions)
    const data = rawData.entities.map((secret) => toOutputDto(secret))

    return createPaginationData<SecretMetadataDto, SecretListDto>(
      listQueryOptions,
      requestUrl,
      rawData.itemCount,
      data
    )
  }

  @Post()
  @ApiOperation({
    summary:
      'Create a new secret in the namespace. The secret value will be stored in a vault and only retrieved for runs. The size of secret values is limited by a configurable value, default is 8kb.',
  })
  @ApiCreatedResponse({
    type: SecretMetadataDto,
    description: 'Metadata of created secret',
  })
  @ApiBadRequestResponse({ description: 'Constraint violation on input data' })
  @ApiBody({ type: SecretPostDto })
  async create(
    @Param('namespaceId') namespaceId: number,
    @Body() secretDto: SecretPostDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<SecretMetadataDto> {
    validateBody(secretDto, postSchema)
    validateId(namespaceId)

    const newSecret = await this.service.addSecret(
      namespaceId,
      secretDto.name.trim(),
      secretDto.description?.trim(),
      secretDto.secret.trim()
    )
    res.header(
      'Location',
      `${res.req.protocol}://${res.req.headers.host}${res.req.url}/${newSecret.name}`
    )
    return toOutputDto(newSecret)
  }

  @Patch(':name')
  @ApiOperation({
    summary:
      'Update a secret, i.e., change description and/or the secret value. The size of secret values is limited by a configurable value, default is 8kb. The name cannot be changed, replace this secret with a new one instead.',
  })
  @ApiOkResponse({
    type: SecretMetadataDto,
    description: 'Metadata of updated secret',
  })
  @ApiNotFoundResponse({
    description: 'Secret with the given name not found in namespace',
  })
  @ApiBadRequestResponse({ description: 'Constraint violation on input data' })
  @ApiBody({ type: SecretPatchDto })
  async update(
    @Param('namespaceId') namespaceId: number,
    @Param('name') name: string,
    @Body() secretDto: SecretPatchDto
  ): Promise<SecretMetadataDto> {
    validateName(name)
    validateBody(secretDto, patchSchema)
    validateId(namespaceId)

    return toOutputDto(
      await this.service.updateSecret(
        namespaceId,
        name,
        secretDto.description,
        secretDto.secret?.trim()
      )
    )
  }

  @Delete(':name')
  @ApiOperation({
    summary:
      'Delete the given secret, this will remove the secret value from the vault as well.',
  })
  @ApiBadRequestResponse({
    description: 'No proper id given',
  })
  @ApiOkResponse({ description: 'Secret deleted' })
  async delete(
    @Param('namespaceId') namespaceId: number,
    @Param('name') name: string
  ): Promise<void> {
    validateName(name)
    validateId(namespaceId)

    return this.service.deleteSecret(namespaceId, name)
  }
}
