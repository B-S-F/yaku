import { Test, TestingModule } from '@nestjs/testing'
import { UserProfileController } from './user-profile.controller'
import { UserProfileService } from './user-profile.service'
import { GetUserProfileDto } from './dto/get-user-profile.dto'
import {
  getUserProfileDTOFixtures,
  updateUserProfileDTOFixtures,
} from './utils/fixture/data.fixture'
import { NotAcceptableException } from '@nestjs/common'
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'

describe('UserProfileController', () => {
  let controller: UserProfileController
  let service: UserProfileService

  let moduleRef: TestingModule

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [UserProfileController],
      providers: [
        {
          provide: UserProfileService,
          useValue: {
            get: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = moduleRef.get<UserProfileController>(UserProfileController)
    service = moduleRef.get<UserProfileService>(UserProfileService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('get', () => {
    it('should get the user profile', async () => {
      const expected: GetUserProfileDto = getUserProfileDTOFixtures[0]
      const serviceGetSpy = jest
        .spyOn(service, 'get')
        .mockResolvedValueOnce(expected)
      const request = {
        user: {
          kc_sub: '0c8a2662-3a96-4196-b533-763db114ad73',
        },
      }
      const result = await controller.get(request as any)

      expect(serviceGetSpy).toBeCalledTimes(1)
      expect(result).toEqual(expected)
    })

    it('should throw a NotAcceptableException', async () => {
      const expected: GetUserProfileDto = getUserProfileDTOFixtures[0]
      const serviceGetSpy = jest
        .spyOn(service, 'get')
        .mockResolvedValueOnce(expected)
      const request = {
        user: {
          kc_sub: undefined,
        },
      }

      await expect(async () => {
        await controller.get(request as any)
      }).rejects.toThrow(
        new NotAcceptableException(
          `User profiles are only available for keycloak users`
        )
      )

      expect(serviceGetSpy).not.toBeCalled()
    })
  })

  describe('update', () => {
    it('should update the user profile', async () => {
      const expected: GetUserProfileDto = getUserProfileDTOFixtures[0]
      const updateUserProfileDto: UpdateUserProfileDto =
        updateUserProfileDTOFixtures[0]
      const serviceUpdateSpy = jest
        .spyOn(service, 'update')
        .mockResolvedValueOnce(expected)
      const request = {
        user: {
          kc_sub: '0c8a2662-3a96-4196-b533-763db114ad73',
        },
      }
      const result = await controller.update(
        updateUserProfileDto,
        request as any
      )

      expect(serviceUpdateSpy).toBeCalledTimes(1)
      expect(result).toEqual(expected)
    })

    it('should throw a NotAcceptableException', async () => {
      const updateUserProfileDto: UpdateUserProfileDto =
        updateUserProfileDTOFixtures[0]
      const serviceUpdateSpy = jest.spyOn(service, 'update')
      const request = {
        user: {
          kc_sub: undefined,
        },
      }

      await expect(async () => {
        await controller.update(updateUserProfileDto, request as any)
      }).rejects.toThrow(
        new NotAcceptableException(
          `User profiles are only available for keycloak users`
        )
      )

      expect(serviceUpdateSpy).not.toBeCalled()
    })
  })
})
