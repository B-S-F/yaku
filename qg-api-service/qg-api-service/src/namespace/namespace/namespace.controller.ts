import { validateBody, validateId } from '@B-S-F/api-commons-lib'
import {
  KeyCloakNamespace,
  KeyCloakUser,
} from '@B-S-F/api-keycloak-auth-lib'
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiNotFoundResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Request } from 'express'
import { z } from 'zod'
import { ADMIN_ROLE, Roles } from '../../guards/roles.guard'
import { Namespace } from './namespace.entity'
import { NamespaceService } from './namespace.service'

class UserDto {
  @ApiProperty({
    description: 'The username for the user, this is unique within the service',
    example: 'cool_user@someorg.com',
    type: 'string',
  })
  username: string
}

const userSchema = z
  .object({
    username: z.string().trim().min(1),
  })
  .strict()

class NamespacePostPatchDto {
  @ApiProperty({
    description: 'Name of the namespace',
    example: 'Namespace for AB/XYZ',
    type: 'string',
  })
  name: string

  @ApiProperty({
    description: 'List of users that may access the namespace, may be empty',
    type: UserDto,
    isArray: true,
  })
  users: UserDto[]
}

const postSchema = z
  .object({
    name: z.string().trim().min(1),
    users: z.array(userSchema).optional(),
  })
  .strict()

const patchSchema = z
  .object({
    name: z.string().trim().min(1),
    users: z.array(userSchema).optional(),
  })
  .strict()

class NamespaceDto extends NamespacePostPatchDto {
  @ApiProperty({
    description:
      'Id of the namespace, this is needed in most endpoints as parameter in the url.',
    example: 5,
  })
  id: number
}

function toOutputDto(namespace: Namespace | KeyCloakNamespace): NamespaceDto {
  const dto = new NamespaceDto()
  dto.id = namespace.id
  dto.name = namespace.name
  dto.users = []
  return dto
}

@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTags('Namespaces')
@Controller()
export class NamespaceController {
  constructor(private readonly namespaceService: NamespaceService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve all namespaces, the current user has access to',
  })
  @ApiOkResponse({
    description: 'List of namespace resources',
    type: NamespaceDto,
    isArray: true,
  })
  async getList(@Req() request: Request): Promise<NamespaceDto[]> {
    const requestUser = request.user as KeyCloakUser
    return (await this.namespaceService.getList(requestUser)).map(
      (namespace: Namespace | KeyCloakNamespace) => toOutputDto(namespace)
    )
  }

  @ApiExcludeEndpoint()
  @Get(':id')
  @ApiOkResponse({
    description: 'Namespace information',
    type: NamespaceDto,
  })
  @Roles(ADMIN_ROLE)
  async get(@Param('id') id: number): Promise<NamespaceDto> {
    validateId(id)
    return toOutputDto(await this.namespaceService.get(id))
  }

  @ApiExcludeEndpoint()
  @Post()
  @ApiBadRequestResponse({ description: 'Given name or users have issues' })
  @Roles(ADMIN_ROLE)
  async create(
    @Body() namespace: NamespacePostPatchDto
  ): Promise<NamespaceDto> {
    validateBody(namespace, postSchema)

    if (!namespace.name || !namespace.name.trim()) {
      throw new BadRequestException(
        'A new namespace needs a name, currently undefined'
      )
    }
    return toOutputDto(await this.namespaceService.create(namespace.name))
  }

  @ApiExcludeEndpoint()
  @Patch(':id')
  @ApiBadRequestResponse({ description: 'Given name or users have issues' })
  @ApiNotFoundResponse({ description: 'Namespace with this id not found' })
  @Roles(ADMIN_ROLE)
  async update(
    @Param('id') id: number,
    @Body() namespace: NamespacePostPatchDto
  ): Promise<NamespaceDto> {
    validateId(id)
    validateBody(namespace, patchSchema)

    return toOutputDto(await this.namespaceService.update(id, namespace.name))
  }

  private createUserList(
    userList: { username: string }[] | null | undefined
  ): string[] {
    return (userList ?? []).map((user) => user.username)
  }
}
