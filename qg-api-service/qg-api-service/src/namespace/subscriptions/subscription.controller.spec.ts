import { TestingModule, Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SubscriptionController } from './subscription.controller'
import { SubscriptionService } from './subscription.service'
import { SubscriptionEntity } from './entity/subscription.entity'
import { KeyCloakUser } from '@B-S-F/api-keycloak-auth-lib'
import { SubscriptionOperation, SubscriptionPostDto } from './subscription.dto'
import { Logger, LoggerModule, PinoLogger } from 'nestjs-pino'
import { UsersModule } from '../users/users.module'

describe('SubscriptionController', () => {
  let subscriptionController: SubscriptionController
  let subscriptionService: SubscriptionService
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({}), UsersModule],
      controllers: [SubscriptionController],
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(SubscriptionEntity),
          useClass: Repository,
        },
        { provide: PinoLogger, useValue: { pinoHttp: jest.fn() } },
        { provide: Logger, useValue: { error: jest.fn() } },
      ],
    }).compile()

    subscriptionController = moduleRef.get<SubscriptionController>(
      SubscriptionController
    )
    subscriptionService =
      moduleRef.get<SubscriptionService>(SubscriptionService)
  })
  describe('manageSubscription', () => {
    it('should create the subscription', async () => {
      const user: KeyCloakUser = {
        id: 1,
        kc_id: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        kc_iss: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        kc_sub: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        username: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        email: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        displayName: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        roles: [],
        namespaces: [],
        interactive_login: true,
      }
      const request = { user: user }
      const releaseId = 1
      const body: SubscriptionPostDto = {
        operation: SubscriptionOperation.subscribe,
        releaseId: releaseId,
      }
      jest
        .spyOn(subscriptionService, 'createSubscription')
        .mockResolvedValue(true)

      const result = await subscriptionController.manageSubscription(
        body,
        request as any
      )
      expect(result).toEqual(true)
      expect(subscriptionService.createSubscription).toBeCalled()
    })

    it('should delete the subscription', async () => {
      const user: KeyCloakUser = {
        id: 1,
        kc_id: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        kc_iss: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        kc_sub: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        username: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        email: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        displayName: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        roles: [],
        namespaces: [],
        interactive_login: true,
      }
      const request = { user: user }
      const releaseId = 1
      const body: SubscriptionPostDto = {
        operation: SubscriptionOperation.unsubscribe,
        releaseId: releaseId,
      }
      jest
        .spyOn(subscriptionService, 'deleteSubscription')
        .mockResolvedValue(true)

      const result = await subscriptionController.manageSubscription(
        body,
        request as any
      )
      expect(result).toEqual(true)
      expect(subscriptionService.deleteSubscription).toBeCalled()
    })
  })
  describe('getSubscriptionStatus', () => {
    it('should return the subscription', async () => {
      const userId = 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d'
      const releaseId = 1

      const subscriptionEntity: SubscriptionEntity = {
        userId: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
        releaseId: 1,
        creationTime: new Date(),
        release: null,
      }
      jest
        .spyOn(subscriptionService, 'getSubscriptionStatus')
        .mockResolvedValue(subscriptionEntity)

      const result = await subscriptionController.getSubscriptionStatus(
        userId,
        releaseId
      )
      expect(result).toEqual(subscriptionEntity)
    })
  })
})
