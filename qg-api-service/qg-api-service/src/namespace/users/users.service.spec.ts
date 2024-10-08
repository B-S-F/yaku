import { SortOrder } from '@B-S-F/api-commons-lib'
import {
  KeyCloakService,
  KeyCloakUserOfRole,
  MissingUserError,
} from '@B-S-F/api-keycloak-auth-lib'
import { Test, TestingModule } from '@nestjs/testing'
import { LoggerModule } from 'nestjs-pino'
import { LocalKeyCloakModule } from '../../keycloak/local.keycloak.module'
import { UsersCache, UsersCacheConfig } from './users.cache'
import { DELETED_USER, UsersService } from './users.service'

describe('UsersService', () => {
  let service: UsersService
  let keycloakService: KeyCloakService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, UsersCacheConfig, UsersCache],
      imports: [LocalKeyCloakModule, LoggerModule.forRoot({})],
    })
      .overrideProvider(KeyCloakService)
      .useValue({
        getUsersOfNamespace: jest.fn(),
      })
      .compile()

    service = module.get<UsersService>(UsersService)
    keycloakService = module.get<KeyCloakService>(KeyCloakService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('list', () => {
    const keycloakUsers: KeyCloakUserOfRole[] = [
      {
        username: 'user1',
        kc_id: 'user1_id',
        email: 'user1@example.com',
        displayName: 'User 1',
        firstName: 'User',
        lastName: '1',
      },
      {
        username: 'user2',
        kc_id: 'user2_id',
        email: 'user2@example.com',
        displayName: 'User 2',
        firstName: 'User',
        lastName: '2',
      },
      {
        username: 'user3',
        kc_id: 'user3_id',
        email: 'user3@example.com',
        displayName: 'User 3',
        firstName: 'User',
        lastName: '3',
      },
      {
        username: 'user4',
        kc_id: 'user4_id',
        email: 'user4@example.com',
        displayName: 'User 4',
        firstName: 'User',
        lastName: '4',
      },
    ]

    it('should return a list of users', async () => {
      keycloakService.getUsersOfNamespace = jest
        .fn()
        .mockResolvedValue(keycloakUsers)

      const result = await service.list(1)
      const expected = [
        {
          id: 'user1_id',
          username: 'user1',
          email: 'user1@example.com',
          displayName: 'User 1',
          firstName: 'User',
          lastName: '1',
        },
        {
          id: 'user2_id',
          username: 'user2',
          email: 'user2@example.com',
          displayName: 'User 2',
          firstName: 'User',
          lastName: '2',
        },
        {
          id: 'user3_id',
          username: 'user3',
          email: 'user3@example.com',
          displayName: 'User 3',
          firstName: 'User',
          lastName: '3',
        },
        {
          id: 'user4_id',
          username: 'user4',
          email: 'user4@example.com',
          displayName: 'User 4',
          firstName: 'User',
          lastName: '4',
        },
      ]

      expect(result).toEqual(expected)
    })

    it('should return an empty list if no users are found', async () => {
      keycloakService.getUsersOfNamespace = jest.fn().mockResolvedValue([])

      const result = await service.list(1)

      expect(result).toEqual([])
    })
  })

  describe('listWithQueryOptions', () => {
    const keycloakUsers: KeyCloakUserOfRole[] = [
      {
        username: 'abc@bosch.com',
        kc_id: 'Charly Abel',
        email: 'abc@bosch.com',
        displayName: 'User1',
        firstName: 'User1',
        lastName: '',
      },
      {
        username: 'def@bosch.com',
        kc_id: 'def_id',
        email: 'def@bosch.com',
        displayName: 'Efi Dobel',
        firstName: 'Efi',
        lastName: 'Dobel',
      },
      {
        username: 'ghi@bosch.com',
        kc_id: 'ghi_id',
        email: 'ghi@bosch.com',
        displayName: 'Hilde Gerster',
        firstName: 'Hilde',
        lastName: 'Gerster',
      },
      {
        username: 'user4@bosch.com',
        kc_id: 'user4_id',
        email: 'user4@bosch.com',
        displayName: 'User 4',
        firstName: 'User',
        lastName: '4',
      },
    ]

    it('should return a paginated list of users', async () => {
      keycloakService.getUsersOfNamespace = jest
        .fn()
        .mockResolvedValue(keycloakUsers)

      const result = await service.listWithQueryOptions(1, 1, 2)
      const expected = [
        {
          id: 'Charly Abel',
          username: 'abc@bosch.com',
          email: 'abc@bosch.com',
          displayName: 'User1',
          firstName: 'User1',
          lastName: '',
        },
        {
          id: 'user4_id',
          username: 'user4@bosch.com',
          email: 'user4@bosch.com',
          displayName: 'User 4',
          firstName: 'User',
          lastName: '4',
        },
      ]

      expect(result).toEqual({
        entities: expected,
        itemCount: 4,
      })

      const result2 = await service.listWithQueryOptions(1, 2, 2)
      const expected2 = [
        {
          id: 'ghi_id',
          username: 'ghi@bosch.com',
          email: 'ghi@bosch.com',
          displayName: 'Hilde Gerster',
          firstName: 'Hilde',
          lastName: 'Gerster',
        },
        {
          id: 'def_id',
          username: 'def@bosch.com',
          email: 'def@bosch.com',
          displayName: 'Efi Dobel',
          firstName: 'Efi',
          lastName: 'Dobel',
        },
      ]

      expect(result2).toEqual({
        entities: expected2,
        itemCount: 4,
      })

      const result3 = await service.listWithQueryOptions(1, 3, 2)

      expect(result3).toEqual({
        entities: [],
        itemCount: 4,
      })
    })
  })

  describe('sortUsers', () => {
    const users = [
      {
        id: 'user1',
        displayName: 'User 1',
        username: 'user1@test.com',
        email: 'user1@test.com',
        firstName: 'User',
        lastName: '1',
      },
      {
        id: 'user2',
        displayName: 'User 2',
        username: 'user2@test.com',
        email: 'user2@test.com',
        firstName: 'User',
        lastName: '2',
      },
      {
        id: 'user3',
        displayName: 'User 3',
        username: 'user3@test.com',
        email: 'user3@test.com',
        firstName: 'User',
        lastName: '3',
      },
      {
        id: 'user4',
        displayName: 'User 4',
        username: 'user4@test.com',
        email: 'user4@test.com',
        firstName: 'User',
        lastName: '4',
      },
    ]

    it('should sort the users based on the sortOrder', () => {
      const usersCopy = JSON.parse(JSON.stringify(users))
      const result = service.sortUsers(users, 'displayName', SortOrder.ASC)

      expect(result).toEqual([
        usersCopy[0],
        usersCopy[1],
        usersCopy[2],
        usersCopy[3],
      ])

      const result2 = service.sortUsers(users, 'displayName', SortOrder.DESC)

      expect(result2).toEqual([
        usersCopy[3],
        usersCopy[2],
        usersCopy[1],
        usersCopy[0],
      ])
    })

    it('should throw an error if the sortBy property does not exist', () => {
      expect(() =>
        service.sortUsers(users, 'name' as any, SortOrder.ASC)
      ).toThrow('Property name does not exist in UserInNamespaceEntity')
    })

    it('should return the users if the array is empty', () => {
      const result = service.sortUsers([], 'id', SortOrder.ASC)

      expect(result).toEqual([])
    })
  })

  describe('paginateUsers', () => {
    const users = [
      {
        id: 'user1',
        displayName: 'User 1',
        username: 'user1@test.com',
        email: 'user1@test.com',
        firstName: 'User',
        lastName: '1',
      },
      {
        id: 'user2',
        displayName: 'User 2',
        username: 'user2@test.com',
        email: 'user2@test.com',
        firstName: 'User',
        lastName: '2',
      },
      {
        id: 'user3',
        displayName: 'User 3',
        username: 'user3@test.com',
        email: 'user3@test.com',
        firstName: 'User',
        lastName: '3',
      },
      {
        id: 'user4',
        displayName: 'User 4',
        username: 'user4@test.com',
        email: 'user4@test.com',
        firstName: 'User',
        lastName: '4',
      },
    ]

    it('should return the paginated users', () => {
      const result = service.paginateUsers(users, 1, 2)

      expect(result).toEqual([users[0], users[1]])

      const result2 = service.paginateUsers(users, 2, 2)

      expect(result2).toEqual([users[2], users[3]])

      const result3 = service.paginateUsers(users, 3, 2)

      expect(result3).toEqual([])
    })

    it('should return the users if the array is empty', () => {
      const result = service.paginateUsers([], 1, 2)

      expect(result).toEqual([])
    })

    it('should return the users if the page is out of bounds', () => {
      const result = service.paginateUsers(users, 4, 2)

      expect(result).toEqual([])
    })

    it('should return the users if the items is 0', () => {
      const result = service.paginateUsers(users, 1, 0)

      expect(result).toEqual([])
    })
  })

  describe('searchUsers', () => {
    const users = [
      {
        id: 'user1',
        displayName: 'User 1',
        username: 'user1@test.com',
        email: 'user1@test.com',
        firstName: 'User',
        lastName: '1',
      },
      {
        id: 'user2',
        displayName: 'User 2',
        username: 'user2@test.com',
        email: 'user2@test.com',
        firstName: 'User',
        lastName: '2',
      },
      {
        id: 'user3',
        displayName: 'User 3',
        username: 'user3@test.com',
        email: 'user3@test.com',
        firstName: 'User',
        lastName: '3',
      },
      {
        id: 'user4',
        displayName: 'User 4',
        username: 'user4@test.com',
        email: 'user4@test.com',
        firstName: 'User',
        lastName: '4',
      },
    ]

    it('should return the users that contain the search term', () => {
      const result = service.searchUsers(users, '1')

      expect(result).toEqual([users[0]])

      const result2 = service.searchUsers(users, 'User')

      expect(result2).toEqual(users)
    })

    it('should return the users if the search term is empty', () => {
      const result = service.searchUsers(users, '')

      expect(result).toEqual(users)
    })

    it('should return an empty array if no users are found', () => {
      const result = service.searchUsers(users, 'user5')

      expect(result).toEqual([])
    })

    it('should return an empty array if the array is empty', () => {
      const result = service.searchUsers([], 'user1')

      expect(result).toEqual([])
    })
  })

  describe('getUser', () => {
    const mockUser = {
      username: 'user1',
      kc_id: '4e9a269e-dd69-4faf-9e96-a680fcfbf3a7',
      email: 'user1@example.com',
      displayName: 'User 1',
      firstName: 'User',
      lastName: '1',
    }

    it('should return a user', async () => {
      keycloakService.getUserById = jest.fn().mockResolvedValue(mockUser)

      const result = await service.getUser(
        '4e9a269e-dd69-4faf-9e96-a680fcfbf3a7'
      )
      expect(result).toEqual({
        id: '4e9a269e-dd69-4faf-9e96-a680fcfbf3a7',
        username: 'user1',
        email: 'user1@example.com',
        displayName: 'User 1',
        firstName: 'User',
        lastName: '1',
      })
    })

    it('should return a user by email if it contains an @', async () => {
      keycloakService.getUserByUsername = jest.fn().mockResolvedValue(mockUser)

      const result = await service.getUser('user1@example.com')
      expect(result).toEqual({
        id: '4e9a269e-dd69-4faf-9e96-a680fcfbf3a7',
        username: 'user1',
        email: 'user1@example.com',
        displayName: 'User 1',
        firstName: 'User',
        lastName: '1',
      })
    })

    it('should return the DELETED_USER if MissingUserError is thrown', async () => {
      keycloakService.getUserById = jest
        .fn()
        .mockRejectedValue(new MissingUserError('User not found'))

      const result = await service.getUser(
        '4e9a269e-dd69-4faf-9e96-a680fcfbf3a7'
      )
      expect(result).toEqual(DELETED_USER)
    })

    it('should throw an InternalServerError if an error is thrown', async () => {
      keycloakService.getUserById = jest.fn().mockRejectedValue(new Error())

      await expect(
        service.getUser('4e9a269e-dd69-4faf-9e96-a680fcfbf3a7')
      ).rejects.toThrow()
    })
  })
})
