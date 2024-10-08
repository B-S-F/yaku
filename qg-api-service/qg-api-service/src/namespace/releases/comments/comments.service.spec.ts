import { EntityList } from '@B-S-F/api-commons-lib'
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { LoggerModule } from 'nestjs-pino'
import { EntityManager, QueryRunner } from 'typeorm'
import { NotificationType } from '../../../mailing/mailing.utils'
import { RequestUser } from '../../../namespace/module.utils'
import { Namespace } from '../../../namespace/namespace/namespace.entity'
import {
  DELETED_USER,
  UsersService,
} from '../../../namespace/users/users.service'
import { UserInNamespaceDto } from '../../../namespace/users/users.utils'
import { NotificationService } from '../../../notifications/notification.service'
import { SubscriptionEntity } from '../../subscriptions/entity/subscription.entity'
import { SubscriptionService } from '../../subscriptions/subscription.service'
import { ApprovalState } from '../approvals/approvals.util'
import * as releasesModuleUtils from '../module.utils'
import { ReleaseEntity } from '../release.entity'
import {
  CheckReference,
  CommentAuditService,
  CommentEntity,
  CommentStatus,
} from './comment.entity'
import { CommentDto, Reference, ReferenceType } from './comments.utils'

import { CommentsService } from './comments.service'

describe('CommentsService', () => {
  let service: CommentsService
  let queryRunner: QueryRunner
  let notificationService: NotificationService

  const user1 = {
    id: 'a516118c-3d75-41a9-a8c9-5e26de31f0e3',
    username: 'user1@domain.gTLD',
    displayName: 'User 1',
  } as RequestUser
  const user2 = {
    id: 'fff6118c-3d75-41a9-a8c9-5e26de31f0e3',
    username: 'user2@domain.gTLD',
    displayName: 'User 2',
  } as RequestUser
  const user3 = {
    id: 'user3_id',
    username: 'user3@domain.gTLD',
    displayName: 'User 3',
  } as RequestUser
  const user4 = {
    id: 'user4_id',
    username: 'user4@domain.gTLD',
    displayName: 'User 4',
  } as RequestUser

  const usersInNamespace: UserInNamespaceDto[] = [
    {
      ...user1,
      email: 'user1@domain.gTLD',
      firstName: 'fName1',
      lastName: 'lName1',
    },
    {
      ...user2,
      email: 'user2@domain.gTLD',
      firstName: 'fName2',
      lastName: 'lName2',
    },
    {
      ...user3,
      email: 'user3@domain.gTLD',
      firstName: 'fName3',
      lastName: 'lName3',
    },
    {
      ...user4,
      email: 'user4@domain.gTLD',
      firstName: 'fName4',
      lastName: 'lName4',
    },
  ]
  const userInNamespace = (requestUser: RequestUser): UserInNamespaceDto =>
    usersInNamespace.find((user) => user.id === requestUser.id)

  const subscribers = [userInNamespace(user3)]

  const namespace: Namespace = { id: 1, name: 'namespace' }
  const release: ReleaseEntity = {
    id: 1,
    approvalMode: 'one',
    approvalState: 'pending' as ApprovalState,
    config: { id: 1 } as any,
    createdBy: user1.id,
    lastModifiedBy: user2.id,
    creationTime: new Date(),
    lastModificationTime: new Date(),
    name: 'release',
    namespace: namespace,
  } as ReleaseEntity

  let basicComment: CommentEntity
  let childComment: CommentEntity

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    const module = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      providers: [
        CommentsService,
        CommentAuditService,
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
          },
        },
        {
          provide: getRepositoryToken(CommentEntity),
          useValue: {
            manager: {
              connection: {
                createQueryRunner: jest.fn(() => queryRunner),
              },
            },
          },
        },
        {
          provide: getRepositoryToken(SubscriptionEntity),
          useValue: {
            createQueryBuilder: jest.fn(),
            where: jest.fn(),
            getMany: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            pushNotification: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get(CommentsService)
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

    basicComment = new CommentEntity()
    basicComment.id = 1
    basicComment.content = 'content'
    basicComment.todo = false
    basicComment.status = CommentStatus.CREATED
    basicComment.createdBy = user1.id
    basicComment.creationTime = new Date()
    basicComment.lastModifiedBy = user2.id
    basicComment.release = release
    basicComment.lastModificationTime = new Date()
    basicComment.namespace = namespace

    childComment = new CommentEntity()
    childComment.id = 2
    childComment.content = 'content'
    childComment.todo = false
    childComment.status = CommentStatus.CREATED
    childComment.createdBy = user1.id
    childComment.creationTime = new Date()
    childComment.lastModifiedBy = user2.id
    childComment.release = release
    childComment.lastModificationTime = new Date()
    childComment.namespace = namespace

    jest.spyOn(releasesModuleUtils, 'getRelease').mockResolvedValue(release)
  })

  describe('createCommentNotifications', () => {
    const mentionsTitle =
      'You have been mentioned in a comment related to a release approval'
    const participantsTitle = 'A new comment was added to your discussion'

    afterEach(() => jest.restoreAllMocks())

    it.each([
      [
        'ReferenceType.CHECK',
        {
          referenceType: ReferenceType.CHECK,
          reference: {
            requirement: '1',
            check: '1',
            chapter: '1',
          } as CheckReference,
          notificationReference: {
            requirement_id: '1',
            check_id: '1',
            chapter_id: '1',
          },
        },
      ],
      [
        'ReferenceType.RELEASE',
        {
          referenceType: ReferenceType.RELEASE,
          reference: undefined,
          notificationReference: {
            requirement_id: '',
            check_id: '',
            chapter_id: '',
          },
        },
      ],
    ])(
      'should push notification to mentions and subcribers on new %s comment',
      async (_referenceType, testData) => {
        const commentContent =
          '@user1@domain.gTLD mentions @user2@domain.gTLD. @nonExistingUser@domain.gTLD does not exists in this namespace'
        const expectedNotificationContent = `@${user1.displayName} mentions @${user2.displayName}. @nonExistingUser@domain.gTLD does not exists in this namespace`
        const expectedCommonNotificationData = {
          ...testData.notificationReference,
          content: expectedNotificationContent,
          created_by: user1.displayName,
          namespace_name: release.namespace.name,
          release_id: release.id,
          release_name: release.name,
        }
        const expectedMentionsNotificationData = {
          ...expectedCommonNotificationData,
          user_name: userInNamespace(user2).firstName,
          comment_id: basicComment.id,
          parent_comment_id: basicComment.id,
        }
        const expectedCommentsNotificationData = {
          ...expectedCommonNotificationData,
          user_name: userInNamespace(user3).firstName,
          comment_id: basicComment.id,
          parent_comment_id: basicComment.id,
        }
        const expectedNotificationCalls = [
          [
            user2.id,
            mentionsTitle,
            {
              data: expectedMentionsNotificationData,
              type: NotificationType.Mention,
            },
          ],
          [
            user3.id,
            participantsTitle,
            {
              data: expectedCommentsNotificationData,
              type: NotificationType.Comment,
            },
          ],
        ]

        basicComment.reference = testData.reference
        basicComment.content = commentContent
        basicComment.referenceType = testData.referenceType
        jest
          .spyOn(queryRunner.manager, 'findOneOrFail')
          .mockResolvedValue(basicComment)
        const notificationServiceSpy: jest.Spied<
          typeof notificationService.pushNotification
        > = jest.spyOn(notificationService, 'pushNotification')

        await service.createCommentNotifications(
          basicComment.namespace.id,
          release.id,
          basicComment.id,
          user1,
          queryRunner
        )

        expect(notificationServiceSpy).toHaveBeenCalledTimes(
          expectedNotificationCalls.length
        )
        expect(notificationServiceSpy.mock.calls).toEqual(
          expect.arrayContaining(expectedNotificationCalls)
        )
      }
    )

    it.each([['ReferenceType.CHECK'], ['ReferenceType.RELEASE']])(
      'should push notifications to mentions, subscribers and participants on reply to %s comment',
      async (referenceType) => {
        const childCommentContent = `@user2@domain.gTLD replies to ${referenceType} comment and mentions @user4@domain.gTLD. @nonExistingUser@domain.gTLD does not exists in this namespace`
        const expectedNotificationContent = `@${user2.displayName} replies to ${referenceType} comment and mentions @${user4.displayName}. @nonExistingUser@domain.gTLD does not exists in this namespace`
        const expectedNotificationData = {
          chapter_id: '',
          requirement_id: '',
          check_id: '',
          comment_id: childComment.id,
          parent_comment_id: basicComment.id,
          content: expectedNotificationContent,
          created_by: user2.displayName,
          namespace_name: release.namespace.name,
          release_id: release.id,
          release_name: release.name,
        }
        const expectedMentionsNotificationData = {
          ...expectedNotificationData,
          user_name: userInNamespace(user4).firstName,
        }
        const expectedCommentsNotificationData = {
          ...expectedNotificationData,
        }
        const expectedNotificationCalls = [
          [
            user3.id,
            participantsTitle,
            {
              data: {
                ...expectedCommentsNotificationData,
                user_name: userInNamespace(user3).firstName,
              },
              type: NotificationType.Comment,
            },
          ],
          [
            user1.id,
            participantsTitle,
            {
              data: {
                ...expectedCommentsNotificationData,
                user_name: userInNamespace(user1).firstName,
              },
              type: NotificationType.Comment,
            },
          ],
          [
            user4.id,
            mentionsTitle,
            {
              data: expectedMentionsNotificationData,
              type: NotificationType.Mention,
            },
          ],
        ]

        const parentComment = basicComment
        parentComment.referenceType = ReferenceType.CHECK
        parentComment.reference = {
          chapter: '1',
          requirement: '1',
          check: '1',
        } as CheckReference

        childComment.referenceType = ReferenceType.COMMENT
        childComment.content = childCommentContent
        childComment.parent = parentComment

        parentComment.children = [childComment]

        jest
          .spyOn(queryRunner.manager, 'findOneOrFail')
          .mockResolvedValueOnce(childComment)
        jest
          .spyOn(queryRunner.manager, 'find')
          .mockResolvedValueOnce([childComment, parentComment])
        const notificationServiceSpy: jest.Spied<
          typeof notificationService.pushNotification
        > = jest.spyOn(notificationService, 'pushNotification')

        await service.createCommentNotifications(
          childComment.namespace.id,
          release.id,
          childComment.id,
          user2,
          queryRunner
        )

        expect(notificationServiceSpy).toHaveBeenCalledTimes(
          expectedNotificationCalls.length
        )
        expect(notificationServiceSpy.mock.calls).toEqual(
          expect.arrayContaining(expectedNotificationCalls)
        )
      }
    )
  })

  describe('updateCommentNotifications', () => {
    it.each([
      [
        'ReferenceType.CHECK',
        {
          referenceType: ReferenceType.CHECK,
          reference: {
            requirement: '1',
            check: '1',
            chapter: '1',
          } as CheckReference,
          notificationReference: {
            requirement_id: '1',
            check_id: '1',
            chapter_id: '1',
          },
          parent: undefined,
        },
      ],
      [
        'ReferenceType.RELEASE',
        {
          referenceType: ReferenceType.RELEASE,
          notificationReference: {
            requirement_id: '',
            check_id: '',
            chapter_id: '',
          },
          reference: undefined,
          parent: undefined,
          myItEachValue: 'in IT.EACH',
        },
      ],
      [
        'ReferenceType.COMMENT',
        {
          referenceType: ReferenceType.COMMENT,
          notificationReference: {
            requirement_id: '',
            check_id: '',
            chapter_id: '',
          },
          reference: undefined,
          parent: { id: 1 },
        },
      ],
    ])(
      'should push notifications ONLY to new mentions in edited %s comment',
      async (_referenceType, testData) => {
        const initialContent = `@user1@domain.gTLD creates new ${_referenceType} comment mentioning @user2@domain.gTLD and @user3@domain.gTLD`
        const commentContent = `@user1@domain.gTLD edits ${_referenceType} comment mentioning @user2@domain.gTLD and @user4@domain.gTLD`
        const mentionsTitle =
          'You have been mentioned in a comment related to a release approval'
        const expectedNotificatonContent = `@${user1.displayName} edits ${_referenceType} comment mentioning @${user2.displayName} and @${user4.displayName}`
        const expectedMentionsNotificationData = {
          ...testData.notificationReference,
          content: expectedNotificatonContent,
          created_by: user1.displayName,
          namespace_name: release.namespace.name,
          release_id: release.id,
          release_name: release.name,
          user_name: userInNamespace(user4).firstName,
          comment_id: basicComment.id,
          parent_comment_id: basicComment.id,
        }
        const expectedNotificationCalls = [
          [
            user4.id,
            mentionsTitle,
            {
              data: expectedMentionsNotificationData,
              type: NotificationType.Mention,
            },
          ],
        ]

        basicComment.referenceType = testData.referenceType
        basicComment.content = commentContent
        basicComment.reference = testData.reference
        basicComment.parent = testData.parent

        jest
          .spyOn(queryRunner.manager, 'findOneOrFail')
          .mockResolvedValue(basicComment)
        const notificationServiceSpy: jest.Spied<
          typeof notificationService.pushNotification
        > = jest.spyOn(notificationService, 'pushNotification')

        await service.updateCommentNotifications(
          basicComment.namespace.id,
          release.id,
          basicComment.id,
          initialContent,
          user1,
          queryRunner
        )

        expect(notificationServiceSpy).toHaveBeenCalledTimes(
          expectedNotificationCalls.length
        )
        expect(notificationServiceSpy.mock.calls).toEqual(
          expect.arrayContaining(expectedNotificationCalls)
        )
      }
    )
  })

  describe('toCommentDto', () => {
    it('should return a release comment dto', async () => {
      basicComment.referenceType = ReferenceType.RELEASE
      const result = await service.toCommentDto(basicComment)
      expect(result).toEqual({
        id: 1,
        content: 'content',
        todo: false,
        status: CommentStatus.CREATED,
        createdBy: userInNamespace(user1),
        creationTime: basicComment.creationTime,
        lastModifiedBy: userInNamespace(user2),
        lastModificationTime: basicComment.lastModificationTime,
        reference: { type: ReferenceType.RELEASE },
      } as CommentDto)
    })

    it('should return a check comment dto', async () => {
      const reference = new CheckReference()
      reference.chapter = '1'
      reference.requirement = '1'
      reference.check = '1'
      basicComment.reference = reference
      basicComment.referenceType = ReferenceType.CHECK
      const result = await service.toCommentDto(basicComment)
      expect(result).toEqual({
        id: 1,
        content: 'content',
        todo: false,
        status: CommentStatus.CREATED,
        createdBy: userInNamespace(user1),
        creationTime: basicComment.creationTime,
        lastModifiedBy: userInNamespace(user2),
        lastModificationTime: basicComment.lastModificationTime,
        reference: {
          type: ReferenceType.CHECK,
          chapter: '1',
          requirement: '1',
          check: '1',
        },
      } as CommentDto)
    })

    it('should return a comment comment dto', async () => {
      basicComment.parent = { id: 1 } as CommentEntity
      basicComment.referenceType = ReferenceType.COMMENT
      const result = await service.toCommentDto(basicComment)
      expect(result).toEqual({
        id: 1,
        content: 'content',
        todo: false,
        status: CommentStatus.CREATED,
        createdBy: userInNamespace(user1),
        creationTime: basicComment.creationTime,
        lastModifiedBy: userInNamespace(user2),
        lastModificationTime: basicComment.lastModificationTime,
        reference: {
          type: ReferenceType.COMMENT,
          id: 1,
        },
      } as CommentDto)
    })

    it('should NOT replace username-based mention in dto', async () => {
      basicComment.content = `@${user1.username} please take a look`
      basicComment.parent = { id: 1 } as CommentEntity
      basicComment.referenceType = ReferenceType.COMMENT
      const result = await service.toCommentDto(basicComment)
      expect(result).toEqual({
        id: 1,
        content: `@${user1.username} please take a look`,
        todo: false,
        status: CommentStatus.CREATED,
        createdBy: userInNamespace(user1),
        creationTime: basicComment.creationTime,
        lastModifiedBy: userInNamespace(user2),
        lastModificationTime: basicComment.lastModificationTime,
        reference: {
          type: ReferenceType.COMMENT,
          id: 1,
        },
      } as CommentDto)
    })

    it('should replace id-based mention with mail-based mention in comment dto', async () => {
      basicComment.content = `@${user1.id} please take a look - and before I forget it - @${user1.id} please contact @${user2.id}`
      basicComment.parent = { id: 1 } as CommentEntity
      basicComment.referenceType = ReferenceType.COMMENT
      const result = await service.toCommentDto(basicComment)
      expect(result).toEqual({
        id: 1,
        content: `@${user1.username} please take a look - and before I forget it - @${user1.username} please contact @${user2.username}`,
        todo: false,
        status: CommentStatus.CREATED,
        createdBy: userInNamespace(user1),
        creationTime: basicComment.creationTime,
        lastModifiedBy: userInNamespace(user2),
        lastModificationTime: basicComment.lastModificationTime,
        reference: {
          type: ReferenceType.COMMENT,
          id: 1,
        },
      } as CommentDto)
    })

    it('should replace id-based mention with mail-based mention in comment dto - deleted user', async () => {
      basicComment.content =
        '@9303c010-9586-434d-a0de-ac2d4dc64640 check that out'
      basicComment.parent = { id: 1 } as CommentEntity
      basicComment.referenceType = ReferenceType.COMMENT
      const result = await service.toCommentDto(basicComment)
      expect(result).toEqual({
        id: 1,
        content: '@DELETED_USER check that out',
        todo: false,
        status: CommentStatus.CREATED,
        createdBy: userInNamespace(user1),
        creationTime: basicComment.creationTime,
        lastModifiedBy: userInNamespace(user2),
        lastModificationTime: basicComment.lastModificationTime,
        reference: {
          type: ReferenceType.COMMENT,
          id: 1,
        },
      } as CommentDto)
    })
  })

  describe('toCommentWithRepliesDto', () => {
    it('should convert children to replies', async () => {
      childComment.parent = basicComment
      basicComment.children = [childComment]
      const result = await service.toCommentWithRepliesDto(basicComment)
      expect(result.replies).toHaveLength(1)
      expect(result.replies[0]).toEqual(
        await service.toCommentDto(childComment)
      )
    })
  })

  describe('toCommentWithRepliesAndReferenceDto', () => {
    it('should return a release reference', async () => {
      childComment.parent = basicComment
      basicComment.children = [childComment]
      basicComment.referenceType = ReferenceType.RELEASE
      const result = await service.toCommentWithRepliesAndReferenceDto(
        basicComment
      )
      expect(result.replies).toHaveLength(1)
      expect(result.replies[0]).toEqual(
        await service.toCommentDto(childComment)
      )
      expect(result.reference).toEqual({ type: ReferenceType.RELEASE })
    })

    it('should return a check reference', async () => {
      const reference = new CheckReference()
      reference.chapter = '1'
      reference.requirement = '1'
      reference.check = '1'
      basicComment.reference = reference
      basicComment.referenceType = ReferenceType.CHECK
      childComment.parent = basicComment
      const result = await service.toCommentWithRepliesAndReferenceDto(
        basicComment
      )
      expect(result.reference).toEqual({
        type: ReferenceType.CHECK,
        chapter: '1',
        requirement: '1',
        check: '1',
      })
    })

    it('should return a comment reference', async () => {
      basicComment.parent = { id: 1 } as CommentEntity
      basicComment.referenceType = ReferenceType.COMMENT
      const result = await service.toCommentWithRepliesAndReferenceDto(
        basicComment
      )
      expect(result.reference).toEqual({
        type: ReferenceType.COMMENT,
        id: 1,
      })
    })
  })

  describe('toCommentsByReferenceDto', () => {
    it('should return a release reference', async () => {
      const reference = new Reference()
      reference.type = ReferenceType.RELEASE
      basicComment.children = [childComment]
      const result = await service.toCommentsByReferenceDto(
        [basicComment],
        reference
      )
      expect(result.comments).toHaveLength(1)
      expect(result.comments[0]).toEqual(
        await service.toCommentWithRepliesDto(basicComment)
      )
    })

    it('should return a check reference', async () => {
      const reference = new Reference()
      reference.type = ReferenceType.CHECK
      reference.chapter = '1'
      reference.requirement = '1'
      reference.check = '1'
      basicComment.reference = new CheckReference()
      basicComment.reference.chapter = '1'
      basicComment.reference.requirement = '1'
      basicComment.reference.check = '1'
      const result = await service.toCommentsByReferenceDto(
        [basicComment],
        reference
      )
      expect(result.comments).toHaveLength(1)
      expect(result.comments[0]).toEqual(
        await service.toCommentWithRepliesDto(basicComment)
      )
    })

    it('should return a comment reference', async () => {
      const reference = new Reference()
      reference.type = ReferenceType.COMMENT
      reference.id = 1
      basicComment.parent = { id: 1 } as CommentEntity
      const result = await service.toCommentsByReferenceDto(
        [basicComment],
        reference
      )
      expect(result.comments).toHaveLength(1)
      expect(result.comments[0]).toEqual(
        await service.toCommentWithRepliesDto(basicComment)
      )
    })
  })

  describe('toEntityList', () => {
    it('should return a release reference', async () => {
      const entityList = new EntityList<CommentEntity>()
      entityList.entities = [basicComment]
      entityList.itemCount = 1
      const result = await service.toEntityList(entityList)
      expect(result).toEqual({
        itemCount: 1,
        entities: [
          await service.toCommentWithRepliesAndReferenceDto(basicComment),
        ],
      })
    })
  })

  describe('extractReference', () => {
    it('should return a release reference', () => {
      basicComment.referenceType = ReferenceType.RELEASE
      const result = service.extractReference(basicComment)
      expect(result).toEqual({ type: ReferenceType.RELEASE })
    })

    it('should return a check reference', () => {
      const reference = new CheckReference()
      reference.chapter = '1'
      reference.requirement = '1'
      reference.check = '1'
      basicComment.reference = reference
      basicComment.referenceType = ReferenceType.CHECK
      const result = service.extractReference(basicComment)
      expect(result).toEqual({
        type: ReferenceType.CHECK,
        chapter: '1',
        requirement: '1',
        check: '1',
      })
    })

    it('should return a comment reference', () => {
      basicComment.parent = { id: 1 } as CommentEntity
      basicComment.referenceType = ReferenceType.COMMENT
      const result = service.extractReference(basicComment)
      expect(result).toEqual({
        type: ReferenceType.COMMENT,
        id: 1,
      })
    })
  })
})
