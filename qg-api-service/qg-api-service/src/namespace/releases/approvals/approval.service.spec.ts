import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { EntityManager, QueryRunner } from 'typeorm'
import { LoggerModule } from 'nestjs-pino'
import { NotificationService } from '../../../notifications/notification.service'
import { NotificationType } from '../../../mailing/mailing.utils'
import { Namespace } from '../../namespace/namespace.entity'
import { RequestUser } from '../../../namespace/module.utils'
import {
  DELETED_USER,
  UsersService,
} from '../../../namespace/users/users.service'
import { UserInNamespaceDto } from '../../../namespace/users/users.utils'
import { SubscriptionService } from '../../../namespace/subscriptions/subscription.service'
import { CommentsService } from '../comments/comments.service'
import { ReleaseAuditService, ReleaseEntity } from '../release.entity'
import { ApprovalAuditService, ApprovalEntity } from './approvals.entity'
import { ApprovalState } from './approvals.util'

import { ApprovalService } from './approvals.service'

describe('ApprovalService', () => {
  let service: ApprovalService
  let queryRunner: QueryRunner
  let notificationService: NotificationService

  const user1 = {
    id: '870eb77a-868d-4a1d-9776-f1b8694b6fec',
    username: 'user1@domain.gTLD',
    displayName: 'User 1',
    email: 'user1@domain.gTLD',
  } as RequestUser
  const user2 = {
    id: '91c1b801-fed4-438a-a085-d868e61a4e77',
    username: 'user2@domain.gTLD',
    displayName: 'User 2',
    email: 'user2@domain.gTLD',
  } as RequestUser
  const usersInNamespace: UserInNamespaceDto[] = [
    { ...user1, firstName: 'User', lastName: '1' },
    { ...user2, firstName: 'User', lastName: '2' },
  ]
  const userInNamespace = (requestUser: RequestUser): UserInNamespaceDto =>
    usersInNamespace.find((user) => user.id === requestUser.id)
  const subscribers = [userInNamespace(user2)]

  const namespace: Namespace = { id: 1, name: 'namespace' }
  const release: ReleaseEntity = new ReleaseEntity()
  release.id = 1
  release.approvalState = ApprovalState.PENDING
  release.config = { id: 1 } as any
  release.createdBy = user1.id
  release.lastModifiedBy = user2.id
  release.creationTime = new Date()
  release.lastModificationTime = new Date()
  release.name = 'release'
  release.namespace = namespace

  const approval = new ApprovalEntity()
  approval.id = 1
  approval.namespace = namespace
  approval.release = release
  approval.creationTime = new Date()
  approval.lastModificationTime = new Date()

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      providers: [
        ApprovalService,
        {
          provide: ApprovalAuditService,
          useValue: {
            append: jest.fn(),
          },
        },
        {
          provide: ReleaseAuditService,
          useValue: {
            append: jest.fn(),
          },
        },
        {
          provide: CommentsService,
          useValue: {
            createWithTransaction: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUser: jest.fn().mockImplementation((id: string) => {
              const user = usersInNamespace.find((user) => user.id === id)

              return user ?? DELETED_USER
            }),
            list: jest.fn().mockResolvedValue(usersInNamespace),
          },
        },
        {
          provide: SubscriptionService,
          useValue: {
            getSubscribers: jest.fn().mockResolvedValue(subscribers),
            getSubscriptionStatus: jest.fn(),
            createSubscription: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            pushNotification: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ApprovalEntity),
          useValue: {
            manager: {
              connection: { createQueryRunner: jest.fn(() => queryRunner) },
            },
          },
        },
      ],
    }).compile()

    service = module.get(ApprovalService)
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
    notificationService = module.get(NotificationService)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Approval state computation with empty approvals', () => {
    it('Empty approvals result in "pending" for "all" mode', async () => {
      expect(service.computeAggregateApproval('all', [])).toEqual(
        ApprovalState.PENDING
      )
    })

    it('Empty approvals result in "pending" for "one" mode', async () => {
      expect(service.computeAggregateApproval('one', [])).toEqual(
        ApprovalState.PENDING
      )
    })
  })

  describe('Approval state computation with single pending approval', () => {
    const approval = new ApprovalEntity()
    approval.approvalState = ApprovalState.PENDING

    it('Single pending approval results in "pending" for "all" mode', async () => {
      expect(service.computeAggregateApproval('all', [approval])).toEqual(
        ApprovalState.PENDING
      )
    })

    it('Single pending approval results in "pending" for "one" mode', async () => {
      expect(service.computeAggregateApproval('one', [approval])).toEqual(
        ApprovalState.PENDING
      )
    })
  })

  describe('Approval state computation with single approved approval', () => {
    const approval = new ApprovalEntity()
    approval.approvalState = ApprovalState.APPROVED

    it('Single approved approval results in "approved" for "all" mode', async () => {
      expect(service.computeAggregateApproval('all', [approval])).toEqual(
        ApprovalState.APPROVED
      )
    })

    it('Single approved approval results in "approved" for "one" mode', async () => {
      expect(service.computeAggregateApproval('one', [approval])).toEqual(
        ApprovalState.APPROVED
      )
    })
  })

  describe('Approval state computation with mixed approvals', () => {
    const approved = new ApprovalEntity()
    approved.approvalState = ApprovalState.APPROVED

    const pending = new ApprovalEntity()
    pending.approvalState = ApprovalState.PENDING

    it('Mixed approvals result in "pending" for "all" mode', async () => {
      expect(
        service.computeAggregateApproval('all', [approved, pending])
      ).toEqual(ApprovalState.PENDING)
    })

    it('Mixed approvals result in "approved" for "one" mode', async () => {
      expect(
        service.computeAggregateApproval('one', [approved, pending])
      ).toEqual(ApprovalState.APPROVED)
    })
  })

  describe('Approval state computation with many approved approvals', () => {
    const approvals = []
    for (let i = 0; i < 50; i++) {
      const approval = new ApprovalEntity()
      approval.approvalState = ApprovalState.APPROVED
      approvals.push(approval)
    }

    it('Many approved approvals result in "approved" for "all" mode', async () => {
      expect(service.computeAggregateApproval('all', approvals)).toEqual(
        ApprovalState.APPROVED
      )
    })

    it('Many approved approvals result in "approved" for "one" mode', async () => {
      expect(service.computeAggregateApproval('one', approvals)).toEqual(
        ApprovalState.APPROVED
      )
    })
  })

  describe('Approval state computation with many pending approvals', () => {
    const approvals = []
    for (let i = 0; i < 50; i++) {
      const approval = new ApprovalEntity()
      approval.approvalState = ApprovalState.PENDING
      approvals.push(approval)
    }

    it('Many pending approvals result in "pending" for "all" mode', async () => {
      expect(service.computeAggregateApproval('all', approvals)).toEqual(
        ApprovalState.PENDING
      )
    })

    it('Many pending approvals result in "pending" for "one" mode', async () => {
      expect(service.computeAggregateApproval('one', approvals)).toEqual(
        ApprovalState.PENDING
      )
    })
  })

  describe('Approval state computation with many approved and one pending approval', () => {
    const approvals = []
    for (let i = 0; i < 50; i++) {
      const approval = new ApprovalEntity()
      approval.approvalState = ApprovalState.APPROVED
      approvals.push(approval)
    }

    const pending = new ApprovalEntity()
    pending.approvalState = ApprovalState.PENDING
    approvals.push(pending)

    it('Many approved approvals with one pending result in "pending" for "all" mode', async () => {
      expect(service.computeAggregateApproval('all', approvals)).toEqual(
        ApprovalState.PENDING
      )
    })

    it('Many approved approvals with one pending result in "approved" for "one" mode', async () => {
      expect(service.computeAggregateApproval('one', approvals)).toEqual(
        ApprovalState.APPROVED
      )
    })
  })

  describe('updateReleaseApprovalStateNotification', () => {
    const approvalStatusTitle =
      'The approval status of a release you are subscribed to has changed'

    it('should push notification to subscribers on ApprovalState change', async () => {
      release.approvalState = ApprovalState.PENDING
      const approvedState = ApprovalState.APPROVED
      const expectedNotificationData = {
        user_name: userInNamespace(user2).firstName,
        changed_by: user1.displayName,
        namespace_name: namespace.name,
        release_id: release.id,
        release_name: release.name,
        status: approvedState,
      }
      const expectedNotificationCalls = [
        [
          user2.id,
          approvalStatusTitle,
          {
            data: expectedNotificationData,
            type: NotificationType.ApprovalState,
          },
        ],
      ]

      jest.spyOn(queryRunner.manager, 'save').mockResolvedValueOnce(release)
      const notificationServiceSpy: jest.Spied<
        typeof notificationService.pushNotification
      > = jest.spyOn(notificationService, 'pushNotification')

      await service.updateReleaseApprovalState(
        queryRunner,
        namespace.id,
        release.id,
        release,
        approvedState,
        user1
      )

      expect(notificationServiceSpy).toHaveBeenCalledTimes(
        expectedNotificationCalls.length
      )
      expect(notificationServiceSpy.mock.calls).toEqual(
        expect.arrayContaining(expectedNotificationCalls)
      )
    })
  })

  describe('addApproverNotification', () => {
    const newApproverTitle =
      'You have been selected as an approver for a release'

    it('should push notification to new approver when added to a release', async () => {
      const expectedNotificationCalls = [
        [
          user1.id,
          newApproverTitle,
          {
            data: {
              user_name: userInNamespace(user1).firstName,
              added_by: user2.displayName,
              namespace_name: namespace.name,
              release_id: release.id,
              release_name: release.name,
            },
            type: NotificationType.Approval,
          },
        ],
      ]

      approval.approver = user1.id
      approval.approvalState = ApprovalState.PENDING
      approval.createdBy = user2.id
      approval.lastModifiedBy = user2.id

      const approvals = [approval]

      jest
        .spyOn(queryRunner.manager, 'findOneOrFail')
        .mockResolvedValueOnce(approval)
      const notificationServiceSpy: jest.Spied<
        typeof notificationService.pushNotification
      > = jest.spyOn(notificationService, 'pushNotification')

      await service.addApproverNotification(
        namespace.id,
        release.id,
        approval.id,
        user2,
        queryRunner
      )

      expect(notificationServiceSpy).toHaveBeenCalledTimes(
        expectedNotificationCalls.length
      )
      expect(notificationServiceSpy.mock.calls).toEqual(
        expect.arrayContaining(expectedNotificationCalls)
      )
    })
  })
})
