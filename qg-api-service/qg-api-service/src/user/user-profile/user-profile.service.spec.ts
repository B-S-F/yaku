import { EntityManager, EntityTarget, QueryRunner, SaveOptions } from 'typeorm'
import { UserProfile } from './user-profile.entity'
import { UserProfileService } from './user-profile.service'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import {
  createUserProfileDTOFixtures,
  getUserProfileDTOFixtures,
  updateUserProfileDTOFixtures,
  userProfileDataFixtures,
} from './utils/fixture/data.fixture'
import { GetUserProfileDto } from './dto/get-user-profile.dto'
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'

describe('UserProfileService', () => {
  let userProfileService: UserProfileService

  let moduleRef: TestingModule
  let queryRunner: QueryRunner

  const findOneMock = jest.fn()
  const saveMock = jest
    .fn()
    .mockImplementation(
      (
        _entityClass: EntityTarget<UserProfile>,
        userProfile: UserProfile,
        _options: SaveOptions
      ) => userProfile
    )

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        UserProfileService,
        {
          provide: getRepositoryToken(UserProfile),
          useValue: {
            manager: {
              connection: {
                createQueryRunner: jest.fn(() => queryRunner),
              },
            },
          },
        },
      ],
    }).compile()

    userProfileService = moduleRef.get<UserProfileService>(UserProfileService)

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: saveMock,
        findOne: findOneMock,
      } as unknown as EntityManager,
    } as any
  })

  afterEach(() => jest.resetAllMocks())

  it('should be defined', () => {
    expect(userProfileService).toBeDefined()
  })

  describe('create', () => {
    it('should insert an user profile into db', async () => {
      const createUserProfileDto = createUserProfileDTOFixtures[0]
      const newUserProfile: UserProfile = {
        id: '0c8a2662-3a96-4196-b533-763db114ad73',
        emailNotifications: true,
        editor: 'code',
      } as UserProfile
      const expected = new GetUserProfileDto(newUserProfile)

      const result = await userProfileService.create(
        '0c8a2662-3a96-4196-b533-763db114ad73',
        createUserProfileDto
      )

      expect(queryRunner.connect).toBeCalledTimes(1)
      expect(queryRunner.startTransaction).toBeCalledWith('READ UNCOMMITTED')
      expect(queryRunner.manager.save).toBeCalledTimes(1)
      expect(queryRunner.commitTransaction).toBeCalledTimes(1)
      expect(queryRunner.rollbackTransaction).not.toBeCalled()
      expect(queryRunner.release).toBeCalledTimes(1)

      expect(result).toEqual(expected)
    })
    it('should throw an error and rollback the transaction', async () => {
      const createUserProfileDto = createUserProfileDTOFixtures[0]
      saveMock.mockImplementationOnce(() => {
        throw new Error()
      })

      await expect(async () => {
        await userProfileService.create(
          '0c8a2662-3a96-4196-b533-763db114ad73',
          createUserProfileDto
        )
      }).rejects.toThrow()

      expect(queryRunner.connect).toBeCalledTimes(1)
      expect(queryRunner.startTransaction).toBeCalledWith('READ UNCOMMITTED')
      expect(queryRunner.manager.save).toBeCalledTimes(1)
      expect(queryRunner.commitTransaction).not.toBeCalled()
      expect(queryRunner.rollbackTransaction).toBeCalledTimes(1)
      expect(queryRunner.release).toBeCalledTimes(1)
    })
  })

  describe('get', () => {
    it('should get the current user profile', async () => {
      const expected: GetUserProfileDto = getUserProfileDTOFixtures[0]

      const createSpy = jest.spyOn(userProfileService, 'create')
      findOneMock.mockReturnValueOnce(expected)
      const result = await userProfileService.get(
        '0c8a2662-3a96-4196-b533-763db114ad73'
      )

      expect(queryRunner.connect).toBeCalledTimes(1)
      expect(queryRunner.startTransaction).toBeCalledWith('READ COMMITTED')
      expect(queryRunner.manager.findOne).toBeCalledTimes(1)
      expect(queryRunner.commitTransaction).toBeCalledTimes(1)
      expect(queryRunner.rollbackTransaction).not.toBeCalled()
      expect(queryRunner.release).toBeCalledTimes(1)

      expect(createSpy).not.toHaveBeenCalled()

      expect(result).toEqual(expected)
    })
    it('should create a new user profile if it does not exist and afterwards get it', async () => {
      const expected: GetUserProfileDto = getUserProfileDTOFixtures[0]

      const createSpy = jest
        .spyOn(userProfileService, 'create')
        .mockResolvedValueOnce(expected)
      findOneMock.mockReturnValueOnce(null)
      const result = await userProfileService.get(
        '0c8a2662-3a96-4196-b533-763db114ad73'
      )

      expect(queryRunner.connect).toBeCalledTimes(1)
      expect(queryRunner.startTransaction).toBeCalledWith('READ COMMITTED')
      expect(queryRunner.manager.findOne).toBeCalledTimes(1)
      expect(queryRunner.commitTransaction).toBeCalledTimes(1)
      expect(queryRunner.rollbackTransaction).not.toBeCalled()
      expect(queryRunner.release).toBeCalledTimes(1)

      expect(createSpy).toBeCalled()

      expect(result).toEqual(expected)
    })
    it('should throw an error and rollback the transaction', async () => {
      findOneMock.mockImplementationOnce(() => {
        throw new Error()
      })

      await expect(async () => {
        await userProfileService.get('0c8a2662-3a96-4196-b533-763db114ad73')
      }).rejects.toThrow()

      expect(queryRunner.connect).toBeCalledTimes(1)
      expect(queryRunner.startTransaction).toBeCalledWith('READ COMMITTED')
      expect(queryRunner.commitTransaction).not.toBeCalled()
      expect(queryRunner.rollbackTransaction).toBeCalledTimes(1)
      expect(queryRunner.release).toBeCalledTimes(1)
    })
  })

  describe('update', () => {
    it('should update the current user profile', async () => {
      const expected: GetUserProfileDto = getUserProfileDTOFixtures[0]
      const updateUserProfileDto: UpdateUserProfileDto =
        updateUserProfileDTOFixtures[0]

      const createSpy = jest.spyOn(userProfileService, 'create')
      const toUserProfileSpy = jest
        .spyOn(userProfileService, 'toUserProfile')
        .mockReturnValueOnce(userProfileDataFixtures[0])
      findOneMock.mockReturnValueOnce(expected)
      const result = await userProfileService.update(
        '0c8a2662-3a96-4196-b533-763db114ad73',
        updateUserProfileDto
      )

      expect(queryRunner.connect).toBeCalledTimes(1)
      expect(queryRunner.startTransaction).toBeCalledWith('READ UNCOMMITTED')
      expect(queryRunner.manager.findOne).toBeCalledTimes(1)
      expect(createSpy).not.toBeCalled()
      expect(toUserProfileSpy).toBeCalledTimes(1)
      expect(queryRunner.manager.save).toBeCalledTimes(1)
      expect(queryRunner.commitTransaction).toBeCalledTimes(1)
      expect(queryRunner.rollbackTransaction).not.toBeCalled()
      expect(queryRunner.release).toBeCalledTimes(1)

      expect(result).toEqual(expected)
    })

    it('should create an user profile with the updated values if it does not exist', async () => {
      const expected: GetUserProfileDto = getUserProfileDTOFixtures[0]
      const updateUserProfileDto: UpdateUserProfileDto =
        updateUserProfileDTOFixtures[0]

      const createSpy = jest
        .spyOn(userProfileService, 'create')
        .mockResolvedValueOnce(expected)
      const toUserProfileSpy = jest
        .spyOn(userProfileService, 'toUserProfile')
        .mockReturnValueOnce(userProfileDataFixtures[0])
      findOneMock.mockReturnValueOnce(null)
      const result = await userProfileService.update(
        '0c8a2662-3a96-4196-b533-763db114ad73',
        updateUserProfileDto
      )

      expect(queryRunner.connect).toBeCalledTimes(1)
      expect(queryRunner.startTransaction).toBeCalledWith('READ UNCOMMITTED')
      expect(queryRunner.manager.findOne).toBeCalledTimes(1)
      expect(createSpy).toBeCalledTimes(1)
      expect(toUserProfileSpy).toBeCalledTimes(1)
      expect(queryRunner.manager.save).not.toBeCalled()
      expect(queryRunner.commitTransaction).toBeCalledTimes(1)
      expect(queryRunner.rollbackTransaction).not.toBeCalled()
      expect(queryRunner.release).toBeCalledTimes(1)

      expect(result).toEqual(expected)
    })
    it('should throw an error and rollback the transaction', async () => {
      const updateUserProfileDto: UpdateUserProfileDto =
        updateUserProfileDTOFixtures[0]
      findOneMock.mockImplementationOnce(() => {
        throw new Error()
      })

      await expect(async () => {
        await userProfileService.update(
          '0c8a2662-3a96-4196-b533-763db114ad73',
          updateUserProfileDto
        )
      }).rejects.toThrow()

      expect(queryRunner.connect).toBeCalledTimes(1)
      expect(queryRunner.startTransaction).toBeCalledWith('READ UNCOMMITTED')
      expect(queryRunner.commitTransaction).not.toBeCalled()
      expect(queryRunner.rollbackTransaction).toBeCalledTimes(1)
      expect(queryRunner.release).toBeCalledTimes(1)
    })
  })
  describe('toUserProfile', () => {
    it('should return an user profile from an id and a GetUserProfileDto', () => {
      const expected: UserProfile = userProfileDataFixtures[0]
      const getUserProfileDto = getUserProfileDTOFixtures[0]

      const convertedUser: UserProfile = userProfileService.toUserProfile(
        '0c8a2662-3a96-4196-b533-763db114ad73',
        getUserProfileDto
      )

      expect(convertedUser).toEqual(expected)
    })

    it('should return an user profile from an id and a CreateUserProfileDto', () => {
      const expected: UserProfile = userProfileDataFixtures[0]
      const createUserProfileDto = createUserProfileDTOFixtures[0]

      const convertedUser: UserProfile = userProfileService.toUserProfile(
        '0c8a2662-3a96-4196-b533-763db114ad73',
        createUserProfileDto
      )

      expect(convertedUser).toEqual(expected)
    })

    it('should return an user profile from an id and a UpdateUserProfileDto', () => {
      const expected: UserProfile = userProfileDataFixtures[0]
      const updateUserProfileDto = updateUserProfileDTOFixtures[0]

      const convertedUser: UserProfile = userProfileService.toUserProfile(
        '0c8a2662-3a96-4196-b533-763db114ad73',
        updateUserProfileDto
      )

      expect(convertedUser).toEqual(expected)
    })

    it('should return a default user profile if a dto is not provided', () => {
      const expected: UserProfile = {
        id: '0c8a2662-3a96-4196-b533-763db114ad73',
      } as UserProfile

      const convertedUser: UserProfile = userProfileService.toUserProfile(
        '0c8a2662-3a96-4196-b533-763db114ad73'
      )

      expect(convertedUser).toEqual(expected)
    })
  })
})
