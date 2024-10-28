import { EntityList, SortOrder } from '@B-S-F/api-commons-lib'
import {
  KeyCloakService,
  KeyCloakUserOfRole,
  MissingUserError,
} from '@B-S-F/api-keycloak-auth-lib'
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { isUUID } from 'class-validator'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { UsersCache } from './users.cache'
import { AllowedSortProperties, UserInNamespaceDto } from './users.utils'
import { SYSTEM_REQUEST_USER } from '../module.utils'

const CACHE_TIMEOUT = 1000 * 60 * 5 // 5 minutes
export const SYSTEM_USER = new UserInNamespaceDto()
SYSTEM_USER.id = 'SYSTEM_ACTOR'
SYSTEM_USER.username = 'SYSTEM_ACTOR'
SYSTEM_USER.displayName = 'SYSTEM_ACTOR'

export const DELETED_USER = new UserInNamespaceDto()
DELETED_USER.id = 'DELETED_USER'
DELETED_USER.username = 'DELETED_USER'
DELETED_USER.displayName = 'Deleted user'

@Injectable()
export class UsersService {
  @InjectPinoLogger(UsersService.name)
  private readonly logger = new PinoLogger({
    pinoHttp: {
      level: 'trace',
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    },
  })
  constructor(
    @Inject(KeyCloakService)
    private readonly keycloakService: KeyCloakService,
    @Inject(UsersCache)
    private readonly usersCache: UsersCache
  ) {}
  async list(namespaceId: number): Promise<UserInNamespaceDto[]> {
    const usersOfNamespace = await this.keycloakService.getUsersOfNamespace(
      namespaceId
    )
    return usersOfNamespace.map((user) => this.toUserInNamespaceDto(user))
  }

  async listWithQueryOptions(
    namespaceId: number,
    page: number,
    items: number,
    sortBy: AllowedSortProperties = 'displayName',
    sortOrder: SortOrder = SortOrder.DESC,
    search?: string
  ): Promise<EntityList<UserInNamespaceDto>> {
    let usersOfNamespace = await this.list(namespaceId)

    usersOfNamespace = this.sortUsers(
      usersOfNamespace,
      sortBy as keyof UserInNamespaceDto,
      sortOrder
    )

    // Search reduces the amount of users to be paginated which itemCount has to be returned then?
    if (search) {
      usersOfNamespace = this.searchUsers(usersOfNamespace, search)
    }

    const paginatedUsers = this.paginateUsers(usersOfNamespace, page, items)

    return {
      entities: paginatedUsers,
      itemCount: usersOfNamespace.length,
    }
  }

  private async getKeycloakUserById(
    userId: string
  ): Promise<UserInNamespaceDto> {
    const user = await this.keycloakService.getUserById(userId)
    return this.toUserInNamespaceDto(user)
  }

  private async getKeycloakUserByUsername(
    username: string
  ): Promise<UserInNamespaceDto> {
    const user = await this.keycloakService.getUserByUsername(username)
    return this.toUserInNamespaceDto(user)
  }

  async getUser(id: string): Promise<UserInNamespaceDto> {
    if (!id || typeof id !== 'string') {
      throw new InternalServerErrorException('User id is not defined')
    }

    if (id === SYSTEM_USER.id) {
      return SYSTEM_USER
    }

    if (id === SYSTEM_REQUEST_USER.id) {
      return SYSTEM_USER
    }

    const cachedUser = this.usersCache.get(id)
    if (cachedUser) {
      return cachedUser
    }

    let user: UserInNamespaceDto
    try {
      if (id.includes('@')) {
        // TODO: This is a workaround for backwards compatibility, as we used the email as id in the past
        user = await this.getKeycloakUserByUsername(id)
      } else if (isUUID(id)) {
        user = await this.getKeycloakUserById(id)
      } else {
        // This should never happen, as long as the user handling is consistent in the service
        throw new InternalServerErrorException(
          'User id is not a valid UUID nor an email'
        )
      }
    } catch (error) {
      if (!(error instanceof MissingUserError)) throw error
      return DELETED_USER
    }

    this.usersCache.put(user)
    return user
  }

  sortUsers(
    users: UserInNamespaceDto[],
    sortBy: AllowedSortProperties,
    sortOrder: SortOrder
  ) {
    if (users.length === 0) {
      return users
    }
    if (!Object.keys(users[0]).includes(sortBy)) {
      throw new Error(
        `Property ${sortBy} does not exist in UserInNamespaceEntity`
      )
    }

    function sort(user1, user2) {
      if (sortOrder === 'ASC') {
        return user1[sortBy] > user2[sortBy] ? 1 : -1
      } else {
        return user1[sortBy] < user2[sortBy] ? 1 : -1
      }
    }

    users.sort(sort)

    return users
  }

  paginateUsers(
    users: UserInNamespaceDto[],
    page: number,
    items: number
  ): UserInNamespaceDto[] {
    const startIndex = (page - 1) * items
    const endIndex = page * items
    return users.slice(startIndex, endIndex)
  }

  searchUsers(
    users: UserInNamespaceDto[],
    search: string
  ): UserInNamespaceDto[] {
    return users.filter((user) => user.displayName.includes(search))
  }

  toUserInNamespaceDto(user: KeyCloakUserOfRole): UserInNamespaceDto {
    this.logger.debug(
      `keycloak to user -> kc_id: ${user.kc_id}, username: ${user.username}, email: ${user.email}, displayName: ${user.displayName}, firstName: ${user.firstName}, lastName: ${user.lastName}`
    )

    const dto = new UserInNamespaceDto()
    dto.id = user.kc_id
    dto.username = user.username
    dto.email = user.email
    dto.displayName =
      user.displayName?.trim() === '' ||
      user.displayName?.split(' ')[0].trim() === 'undefined'
        ? user.email
        : user.displayName
    dto.firstName = user.firstName
    dto.lastName = user.lastName
    return dto
  }
}
