// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Repository } from 'typeorm'
import { SubscriptionService } from './subscription.service'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { SubscriptionEntity } from './entity/subscription.entity'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Logger, LoggerModule, PinoLogger } from 'nestjs-pino'
import { SubscriptionDto } from './subscription.dto'
import { UsersModule } from '../users/users.module'
import { ReleaseEntity } from '../releases/release.entity'

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService
  let subscriptionRepository: Repository<any>
  let releaseRepository: Repository<any>

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({}), UsersModule],
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(SubscriptionEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ReleaseEntity),
          useClass: Repository,
        },
        {
          provide: PinoLogger,
          useValue: { error: jest.fn() },
        },
        { provide: PinoLogger, useValue: { pinoHttp: jest.fn() } },
        { provide: Logger, useValue: { error: jest.fn() } },
      ],
    }).compile()
    subscriptionService =
      moduleRef.get<SubscriptionService>(SubscriptionService)
    subscriptionRepository = moduleRef.get(
      getRepositoryToken(SubscriptionEntity),
    )
    releaseRepository = moduleRef.get(getRepositoryToken(ReleaseEntity))
  })

  describe('createSubscription', () => {
    it('should create a new subscription and return true', async () => {
      const userId = 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d'
      const releaseId = 1
      const releaseEntity = {
        id: 1,
        name: 'QG4.2 Battery Management BatMax',
        approvalMode: 'one',
        createdBy: '13620f6f-f8b3-4c0e-9293-81fb290718bf',
        lastModifiedBy: '13620f6f-f8b3-4c0e-9293-81fb290718bf',
        plannedDate: new Date(),
        creationTime: new Date(),
        lastModificationTime: new Date(),
        closed: false,
      }
      const subscriptionEntity: SubscriptionEntity = {
        userId: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        releaseId: 1,
        creationTime: new Date(),
        release: null,
      }

      jest.spyOn(releaseRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn().mockResolvedValue(releaseEntity),
      } as any)

      jest.spyOn(subscriptionRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(undefined),
      } as any)

      jest
        .spyOn(subscriptionRepository, 'create')
        .mockReturnValue(subscriptionEntity)
      jest
        .spyOn(subscriptionRepository, 'save')
        .mockResolvedValue(subscriptionEntity)

      const result = await subscriptionService.createSubscription(
        userId,
        releaseId,
      )
      expect(result).toEqual(true)
    })
    it('should throw an BadRequestException if any required parameter si missing', async () => {
      const userId = null
      const releaseId = 1

      await expect(
        subscriptionService.createSubscription(userId, releaseId),
      ).rejects.toThrow(BadRequestException)
    })
    it('should throw an BadRequestException if there is an existing subscription ', async () => {
      const userId = 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d'
      const releaseId = 1
      const releaseEntity = {
        id: 1,
        name: 'QG4.2 Battery Management BatMax',
        approvalMode: 'one',
        createdBy: '13620f6f-f8b3-4c0e-9293-81fb290718bf',
        lastModifiedBy: '13620f6f-f8b3-4c0e-9293-81fb290718bf',
        plannedDate: new Date(),
        creationTime: new Date(),
        lastModificationTime: new Date(),
        closed: false,
      }
      const subscriptionEntity: SubscriptionEntity = {
        userId: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        releaseId: 1,
        creationTime: new Date(),
        release: null,
      }

      jest.spyOn(releaseRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn().mockResolvedValue(releaseEntity),
      } as any)

      jest.spyOn(subscriptionRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(subscriptionEntity),
      } as any)

      await expect(
        subscriptionService.createSubscription(userId, releaseId),
      ).rejects.toThrow(BadRequestException)
    })
    it('should throw an NotFoundException if the release is not found ', async () => {
      const userId = 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d'
      const releaseId = 1
      const subscriptionEntity: SubscriptionEntity = {
        userId: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        releaseId: 1,
        creationTime: new Date(),
        release: null,
      }

      jest.spyOn(subscriptionRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(subscriptionEntity),
      } as any)

      await expect(
        subscriptionService.createSubscription(userId, releaseId),
      ).rejects.toThrow(NotFoundException)
    })
    it('should throw an BadRequestException if creation failed', async () => {
      const userId = 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d'
      const releaseId = 1
      const releaseEntity = {
        id: 1,
        name: 'QG4.2 Battery Management BatMax',
        approvalMode: 'one',
        createdBy: '13620f6f-f8b3-4c0e-9293-81fb290718bf',
        lastModifiedBy: '13620f6f-f8b3-4c0e-9293-81fb290718bf',
        plannedDate: new Date(),
        creationTime: new Date(),
        lastModificationTime: new Date(),
        closed: false,
      }

      jest.spyOn(releaseRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn().mockResolvedValue({
          id: 1,
          name: 'QG4.2 Battery Management BatMax',
          approvalMode: 'one',
          createdBy: '13620f6f-f8b3-4c0e-9293-81fb290718bf',
          lastModifiedBy: '13620f6f-f8b3-4c0e-9293-81fb290718bf',
          plannedDate: new Date(),
          creationTime: new Date(),
          lastModificationTime: new Date(),
          closed: false,
          approvalState: 'pending',
        }),
      } as any)

      jest.spyOn(subscriptionRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(undefined),
      } as any)

      jest.spyOn(subscriptionRepository, 'create').mockReturnValue(undefined)
      jest.spyOn(subscriptionRepository, 'save').mockResolvedValue(undefined)

      await expect(
        subscriptionService.createSubscription(userId, releaseId),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('deleteSubscription', () => {
    it('should delete a subscription and return true', async () => {
      const userId = 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d'
      const releaseId = 1
      const subscriptionEntity: any = { affected: 1 }

      jest
        .spyOn(subscriptionRepository, 'delete')
        .mockResolvedValue(subscriptionEntity)

      const result = await subscriptionService.deleteSubscription(
        userId,
        releaseId,
      )
      expect(result).toEqual(true)
    })

    it('should throw a NotFoundException if subscription is not found', async () => {
      const userId = 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d'
      const releaseId = 1
      const subscriptionEntity: any = { affected: 0 }

      jest
        .spyOn(subscriptionRepository, 'delete')
        .mockResolvedValue(subscriptionEntity)

      await expect(
        subscriptionService.deleteSubscription(userId, releaseId),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('getSubscriptionStatus', () => {
    it('should return the subscription if it exists', async () => {
      const userId = 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d'
      const releaseId = 1
      const subscriptionEntity: SubscriptionEntity = {
        userId: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        releaseId: 1,
        creationTime: new Date(),
        release: null,
      }

      jest.spyOn(subscriptionRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(subscriptionEntity),
      } as any)

      const result = await subscriptionService.getSubscriptionStatus(
        userId,
        releaseId,
      )
      expect(result).toEqual(new SubscriptionDto(subscriptionEntity))
    })

    it('should return null if there is no subscription', async () => {
      const userId = 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d'
      const releaseId = 1

      jest.spyOn(subscriptionRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      } as any)

      const result = await subscriptionService.getSubscriptionStatus(
        userId,
        releaseId,
      )
      expect(result).toEqual(null)
    })
  })
})
