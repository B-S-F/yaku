import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { UserInNamespaceDto } from 'src/namespace/users/users.utils'
import { EntityManager } from 'typeorm'
import { RequestUser } from '../../../namespace/module.utils'
import { SubscriptionService } from '../../../namespace/subscriptions/subscription.service'
import { UsersService } from '../../../namespace/users/users.service'
import { NotificationService } from '../../../notifications/notification.service'
import { OverrideAuditService, OverrideEntity } from './override.entity'
import { OverridesService } from './overrides.service'
import { CheckColor } from './overrides.utils'

describe('OverridesService', () => {
  let service: OverridesService
  let queryRunner: any
  let notificationService: NotificationService

  const user1 = {
    id: 'user1_id',
    email: 'user1æexample.com',
    username: 'user1',
    firstName: 'User',
    lastName: '1',
    displayName: 'User 1',
  } as RequestUser & UserInNamespaceDto
  const user2 = {
    id: 'user2_id',
    email: 'user2@example.com',
    username: 'user2',
    firstName: 'User',
    lastName: '2',
    displayName: 'User 2',
  } as RequestUser & UserInNamespaceDto

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    const module = await Test.createTestingModule({
      providers: [
        OverridesService,
        {
          provide: UsersService,
          useValue: {
            getUser: jest.fn().mockImplementation((id: string) => {
              if (id === user1.id) {
                return user1
              } else if (id === user2.id) {
                return user2
              }
              return null
            }),
            list: jest.fn().mockImplementation(() => [user1, user2]),
          },
        },
        {
          provide: OverrideAuditService,
          useValue: {
            create: jest.fn(),
            list: jest.fn(),
          },
        },
        {
          provide: SubscriptionService,
          useValue: {
            getSubscribers: jest.fn().mockImplementation(() => [user2]),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            pushNotification: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OverrideEntity),
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

    service = module.get<OverridesService>(OverridesService)
    notificationService = module.get<NotificationService>(NotificationService)
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOneOrFail: jest.fn() as any,
        findOne: jest.fn() as any,
        find: jest.fn() as any,
        save: jest.fn() as any,
        delete: jest.fn() as any,
        getRepository: jest.fn() as any,
      } as EntityManager,
    } as any
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getCheckTitle', () => {
    it('should return the title of the check', () => {
      const overideEntity = {
        chapter: 'chapter',
        requirement: 'requirement',
        check: 'check',
      } as OverrideEntity
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce({
        id: 1,
        config: {
          id: 1,
        },
      })
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce({
        id: 1,
      })
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce({
        id: 1,
      })
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce({
        content: `chapters:
    chapter:
        title: chapter
        requirements:
            requirement:
                title: requirement
                checks:
                    check:
                        title: check`,
      })
      expect(
        service['getCheckTitle'](1, 1, overideEntity, queryRunner)
      ).resolves.toEqual('check')
    })

    it('should return undefined if the check is not found', () => {
      const overideEntity = {
        chapter: 'chapter',
        requirement: 'requirement',
        check: 'check2',
      } as OverrideEntity
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce({
        id: 1,
        config: {
          id: 1,
        },
      })
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce({
        id: 1,
      })
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce({
        id: 1,
      })
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce({
        content: `chapters:
        chapter:
            title: chapter
            requirements:
                requirement:
                    title: requirement
                    checks:
                        check:
                            title: check`,
      })
      expect(
        service['getCheckTitle'](1, 1, overideEntity, queryRunner)
      ).resolves.toEqual(undefined)
    })
  })

  describe('notifySubscribers', () => {
    it('should notify the subscribers', async () => {
      const overideEntity = {
        chapter: 'chapter',
        requirement: 'requirement',
        check: 'check',
        namespace: {
          name: 'test',
        },
        release: {
          id: 1,
        },
        lastModifiedBy: user2.id,
      } as OverrideEntity

      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce({
        id: 1,
        config: {
          id: 1,
        },
      })
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce({
        id: 1,
      })
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce({
        id: 1,
      })
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce({
        content: `chapters:
    chapter:
        title: chapter
        requirements:
            requirement:
                title: requirement
                checks:
                    check:
                        title: check`,
      })

      await service['notifySubscribers'](
        queryRunner,
        1,
        1,
        overideEntity,
        CheckColor.GREEN,
        user1
      )

      expect(notificationService.pushNotification).toBeCalledWith(
        user2.id,
        'User is Subscriber to a Release that has a check result manually changed',
        {
          type: 'check_override.mjml',
          data: {
            chapter_id: 'chapter',
            check_id: 'check',
            check_status: 'GREEN',
            check_title: 'check',
            modified_by: 'User',
            namespace_name: 'test',
            release_id: 1,
            release_name: undefined,
            requirement_id: 'requirement',
            user_name: 'User',
          },
        }
      )
    })
  })
})
