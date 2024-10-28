import {
  EntityList,
  ListQueryHandler,
  SortOrder,
} from '@B-S-F/api-commons-lib'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import {
  EntityNotFoundError,
  QueryFailedError,
  QueryRunner,
  Repository,
} from 'typeorm'
import { CommentData, MentionData } from '../../../mailing/mailing.service'
import { NotificationType } from '../../../mailing/mailing.utils'
import {
  RequestUser,
  SYSTEM_REQUEST_USER_ID,
} from '../../../namespace/module.utils'
import {
  DELETED_USER,
  SYSTEM_USER,
  UsersService,
} from '../../../namespace/users/users.service'
import { UserInNamespaceDto } from '../../../namespace/users/users.utils'
import { NotificationService } from '../../../notifications/notification.service'
import { Action, AuditActor } from '../../audit/audit.entity'
import { Namespace } from '../../namespace/namespace.entity'
import { SubscriptionService } from '../../subscriptions/subscription.service'
import {
  checkForClosed,
  getQgConfigFileContent,
  getRelease,
} from '../module.utils'
import { ReleaseEntity } from '../release.entity'
import {
  CheckReference,
  CommentAuditService,
  CommentEntity,
  CommentStatus,
} from './comment.entity'
import {
  CommentDto,
  CommentsByReferenceDto,
  CommentWithRepliesAndReferenceDto,
  CommentWithRepliesDto,
  mentionsDelimiter,
  Reference,
  ReferenceType,
} from './comments.utils'

@Injectable()
export class CommentsService {
  @InjectPinoLogger(CommentsService.name)
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
    @InjectRepository(CommentEntity)
    private readonly repository: Repository<CommentEntity>,
    @Inject(CommentAuditService)
    private readonly auditService: CommentAuditService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
    @Inject(SubscriptionService)
    private readonly subscriptionService: SubscriptionService
  ) {}

  // TODO: This will be not used anymore if the History Endpoint is in place, remove it after UI is updated
  async list(
    namespaceId: number,
    releaseId: number,
    listQueryOptions: any
  ): Promise<EntityList<CommentWithRepliesAndReferenceDto>> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ COMMITTED')
    try {
      const comments = await this.listWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        listQueryOptions
      )

      const commentsWithRepliesAndReferenceDto = await this.toEntityList(
        comments
      )

      await queryRunner.commitTransaction()
      return commentsWithRepliesAndReferenceDto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  // TODO: This will be not used anymore if the History Endpoint is in place, remove it after UI is updated
  async listWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    listQueryHandler: ListQueryHandler
  ): Promise<EntityList<CommentEntity>> {
    const queryBuilder = queryRunner.manager
      .getRepository(CommentEntity)
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoinAndSelect('children.parent', 'parent')
      .where('comment.namespaceId = :namespaceId', { namespaceId })
      .andWhere('comment.releaseId = :releaseId', { releaseId })
      .andWhere('comment.parentId IS NULL')

    listQueryHandler.addToQueryBuilder<CommentEntity>(queryBuilder, 'comment')
    const itemCount = await queryBuilder.getCount()
    const { entities } = await queryBuilder.getRawAndEntities()

    return { entities, itemCount }
  }

  async listComments(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    timestamp: Date,
    amount: number,
    direction: 'before' | 'after'
  ): Promise<CommentEntity[]> {
    const queryBuilder = queryRunner.manager
      .getRepository(CommentEntity)
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoinAndSelect('children.parent', 'parent')
      .where('comment.namespaceId = :namespaceId', { namespaceId })
      .andWhere('comment.releaseId = :releaseId', { releaseId })
      .andWhere('comment.parentId IS NULL')
      .andWhere(
        `comment.creationTime ${direction === 'before' ? '<' : '>'} :timestamp`,
        { timestamp }
      )
      .orderBy('comment.creationTime', direction === 'before' ? 'DESC' : 'ASC')
      .limit(amount)

    return queryBuilder.getMany()
  }

  async listCommentsByStatus(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    status: CommentStatus,
    timestamp: Date,
    amount: number,
    direction: 'before' | 'after'
  ): Promise<CommentEntity[]> {
    const queryBuilder = queryRunner.manager
      .getRepository(CommentEntity)
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoinAndSelect('children.parent', 'parent')
      .where('comment.namespaceId = :namespaceId', { namespaceId })
      .andWhere('comment.releaseId = :releaseId', { releaseId })
      .andWhere('comment.parentId IS NULL')
      .andWhere('comment.status = :status', { status })
      .andWhere(
        `comment.creationTime ${direction === 'before' ? '<' : '>'} :timestamp`,
        { timestamp }
      )
      .orderBy('comment.creationTime', direction === 'before' ? 'DESC' : 'ASC')
      .limit(amount)

    return queryBuilder.getMany()
  }

  async listCommentsByType(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    referenceType: ReferenceType,
    timestamp: Date,
    amount: number,
    direction: 'before' | 'after'
  ): Promise<CommentEntity[]> {
    const queryBuilder = queryRunner.manager
      .getRepository(CommentEntity)
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoinAndSelect('children.parent', 'parent')
      .where('comment.namespaceId = :namespaceId', { namespaceId })
      .andWhere('comment.releaseId = :releaseId', { releaseId })
      .andWhere('comment.parentId IS NULL')
      .andWhere(
        `comment.creationTime ${direction === 'before' ? '<' : '>'} :timestamp`,
        { timestamp }
      )
      .andWhere('comment.referenceType = :referenceType', { referenceType })
      .orderBy('comment.creationTime', direction === 'before' ? 'DESC' : 'ASC')
      .limit(amount)

    return await queryBuilder.getMany()
  }

  async get(
    namespaceId: number,
    releaseId,
    commentId: number
  ): Promise<CommentDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ COMMITTED')
    try {
      const comment = await this.getWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        commentId
      )
      const commentDto = await this.toCommentDto(comment)
      await queryRunner.commitTransaction()
      return commentDto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async getWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    commentId: number
  ): Promise<CommentEntity> {
    try {
      return await queryRunner.manager.findOneOrFail(CommentEntity, {
        where: {
          namespace: { id: namespaceId },
          release: { id: releaseId },
          id: commentId,
        },
        relations: ['namespace', 'release', 'parent'],
      })
    } catch (e) {
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(
          `Comment or Release not found, namespace: ${namespaceId}, release: ${releaseId}, comment: ${commentId}`
        )
      }
    }
  }

  async create(
    namespaceId: number,
    releaseId: number,
    reference: Reference,
    content: string,
    todo: boolean,
    actor: RequestUser
  ): Promise<CommentDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()

    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const comment = await this.createWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        reference,
        content,
        todo,
        actor
      )
      const commentDto = await this.toCommentDto(comment)
      await queryRunner.commitTransaction()
      // Starting a new transaction for the notifications
      await queryRunner.startTransaction('READ COMMITTED')
      await this.createCommentNotifications(
        namespaceId,
        releaseId,
        commentDto.id,
        actor,
        queryRunner
      )
      await queryRunner.commitTransaction()
      return commentDto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async createWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    reference: Reference,
    content: string,
    todo: boolean,
    actor: RequestUser
  ): Promise<CommentEntity> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const contentWithIdMentions =
      await this.replaceUsernameMentionsWithIdMentions(content)

    const newComment = new CommentEntity()
    newComment.content = contentWithIdMentions
    newComment.todo = todo
    newComment.referenceType = reference.type
    newComment.status = CommentStatus.CREATED
    newComment.createdBy = actor.id
    newComment.lastModifiedBy = actor.id
    newComment.creationTime = new Date()
    newComment.lastModificationTime = new Date()
    newComment.namespace = { id: namespaceId } as Namespace
    newComment.release = { id: releaseId } as ReleaseEntity

    if (reference.type === ReferenceType.COMMENT) {
      const parentComment = await this.getWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        reference.id
      )
      newComment.parent = parentComment
    }

    if (reference.type === ReferenceType.CHECK) {
      await this.verifyCheckExists(
        queryRunner,
        namespaceId,
        releaseId,
        reference
      )
      newComment.reference = {
        chapter: reference.chapter,
        requirement: reference.requirement,
        check: reference.check,
      }
    }
    try {
      const comment = await queryRunner.manager.save(newComment)
      await this.auditService.append(
        namespaceId,
        comment.id,
        {},
        comment,
        AuditActor.convertFrom(actor),
        Action.CREATE,
        queryRunner.manager
      )

      return comment
    } catch (e) {
      if (e.name === QueryFailedError.name) {
        if (e.message.includes('violates foreign key constraint')) {
          throw new NotFoundException(
            `Release not found, namespace: ${namespaceId}, release: ${releaseId}`
          )
        }
      }
      throw e
    }
  }

  async getByReference(
    namespaceId: number,
    releaseId: number,
    reference: Reference,
    sortOrder: SortOrder = SortOrder.ASC
  ): Promise<CommentsByReferenceDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ COMMITTED')
    try {
      const comments = await this.getByReferenceWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        reference,
        sortOrder
      )
      const commentsByReferenceDto = await this.toCommentsByReferenceDto(
        comments,
        reference
      )
      await queryRunner.commitTransaction()
      return commentsByReferenceDto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async getByReferenceWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    reference: Reference,
    sortOrder: SortOrder = SortOrder.ASC
  ): Promise<CommentEntity[]> {
    const queryBuilder = queryRunner.manager.createQueryBuilder(
      CommentEntity,
      'comment'
    )

    queryBuilder.select()
    queryBuilder.leftJoinAndSelect('comment.children', 'children')
    queryBuilder.leftJoinAndSelect('children.parent', 'parent')
    queryBuilder.where('comment.namespaceId = :namespaceId', { namespaceId })
    queryBuilder.andWhere('comment.releaseId = :releaseId', { releaseId })

    /*
     * We are not using the reference type here, as not all rows do have a reference type
     * We still have to do the migration
     */

    switch (reference.type) {
      case ReferenceType.CHECK: {
        await this.verifyCheckExists(
          queryRunner,
          namespaceId,
          releaseId,
          reference
        )
        queryBuilder.andWhere(`comment.reference->>'chapter' = :chapter`, {
          chapter: reference.chapter,
        })
        queryBuilder.andWhere(
          `comment.reference->>'requirement' = :requirement`,
          {
            requirement: reference.requirement,
          }
        )
        queryBuilder.andWhere(`comment.reference->>'check' = :check`, {
          check: reference.check,
        })
        break
      }
      case ReferenceType.COMMENT: {
        queryBuilder.andWhere('comment.parentId = :parentId', {
          parentId: reference.id,
        })
        break
      }
      case ReferenceType.RELEASE: {
        queryBuilder.andWhere('comment.reference IS NULL')
        queryBuilder.andWhere('comment.parentId IS NULL')
        break
      }
      case ReferenceType.APPROVAL: {
        break
      }
      default: {
        this.shouldBeUnreachable(reference.type)
      }
    }
    queryBuilder.addOrderBy('comment.creationTime', sortOrder)
    queryBuilder.addOrderBy('children.creationTime', 'ASC')
    return queryBuilder.getMany()
  }

  async resolve(
    namespaceId: number,
    releaseId: number,
    commentId: number,
    actor: RequestUser
  ): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      await this.updateCommentStatusWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        commentId,
        CommentStatus.RESOLVED,
        actor
      )
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async reset(
    namespaceId: number,
    releaseId: number,
    commentId: number,
    actor: RequestUser
  ): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      await this.updateCommentStatusWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        commentId,
        CommentStatus.CREATED,
        actor
      )
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async updateCommentStatusWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    commentId: number,
    status: CommentStatus,
    actor: RequestUser
  ): Promise<CommentEntity> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const currentComment = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      commentId
    )

    if (currentComment.status === status) {
      return currentComment
    }

    const originalComment = currentComment.DeepCopy()

    currentComment.status = status
    currentComment.lastModifiedBy = actor.id
    currentComment.lastModificationTime = new Date()

    const resolvedComment = await queryRunner.manager.save(currentComment)
    await this.auditService.append(
      namespaceId,
      commentId,
      originalComment,
      resolvedComment,
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager
    )
    return resolvedComment
  }

  async update(
    namespaceId: number,
    releaseId: number,
    commentId: number,
    content: string,
    actor: RequestUser
  ): Promise<CommentDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const oldComment = await this.get(namespaceId, releaseId, commentId)
      const comment = await this.updateWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        commentId,
        content,
        actor
      )
      const commentDto = await this.toCommentDto(comment)
      await queryRunner.commitTransaction()

      await this.updateCommentNotifications(
        namespaceId,
        releaseId,
        commentDto.id,
        oldComment.content,
        actor,
        queryRunner
      )

      return commentDto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async updateWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    commentId: number,
    content: string,
    actor: RequestUser
  ): Promise<CommentEntity> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const contentWithIdMentions =
      await this.replaceUsernameMentionsWithIdMentions(content)

    const currentComment = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      commentId
    )

    const original = currentComment.DeepCopy()

    currentComment.content = contentWithIdMentions
    currentComment.lastModifiedBy = actor.id
    currentComment.lastModificationTime = new Date()

    const newComment = await queryRunner.manager.save(currentComment)
    await this.auditService.append(
      namespaceId,
      commentId,
      original,
      newComment,
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager
    )

    return newComment
  }

  async remove(
    namespaceId: number,
    releaseId: number,
    commentId: number,
    actor: RequestUser
  ): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      await this.removeWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        commentId,
        actor
      )
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async removeWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    commentId: number,
    actor: RequestUser
  ): Promise<void> {
    const currentComment = await queryRunner.manager.findOne(CommentEntity, {
      where: {
        namespace: { id: namespaceId },
        release: { id: releaseId },
        id: commentId,
      },
      relations: ['namespace', 'release', 'children'],
    })

    await this.auditService.append(
      namespaceId,
      commentId,
      currentComment,
      {},
      AuditActor.convertFrom(actor),
      Action.DELETE,
      queryRunner.manager
    )
    await this.removeAllChildrenWithTransaction(
      queryRunner,
      namespaceId,
      currentComment,
      actor
    )
    await queryRunner.manager.remove(currentComment)
  }

  async removeAllWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    actor: RequestUser
  ): Promise<void> {
    const comments = await queryRunner.manager.find(CommentEntity, {
      where: { namespace: { id: namespaceId }, release: { id: releaseId } },
      relations: ['namespace', 'release', 'children'],
    })

    for (const comment of comments) {
      await this.auditService.append(
        namespaceId,
        comment.id,
        comment,
        {},
        AuditActor.convertFrom(actor),
        Action.DELETE,
        queryRunner.manager
      )
      if (comment.children.length > 0) {
        await this.removeAllChildrenWithTransaction(
          queryRunner,
          namespaceId,
          comment,
          actor
        )
      }

      await queryRunner.manager.remove(comment)
    }
  }

  async removeAllChildrenWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    comment: CommentEntity,
    actor: RequestUser
  ): Promise<void> {
    for (const child of comment.children) {
      await this.auditService.append(
        namespaceId,
        child.id,
        child,
        {},
        AuditActor.convertFrom(actor),
        Action.DELETE,
        queryRunner.manager
      )
      if (child.children?.length > 0) {
        await this.removeAllChildrenWithTransaction(
          queryRunner,
          namespaceId,
          child,
          actor
        )
      }

      await queryRunner.manager.remove(child)
    }
  }

  async createCommentNotifications(
    namespaceId: number,
    releaseId: number,
    commentId: number,
    actor: RequestUser,
    queryRunner: QueryRunner
  ): Promise<void> {
    const comment = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      commentId
    )
    const namespace = comment.namespace
    const release = comment.release
    const commentReference = this.extractReference(comment)

    const mentions = await this.getMentionsInNamespace(
      namespace.id,
      comment.content
    )
    const processedContent = this.replaceMentions(comment.content, mentions)
    const subscribers = await this.subscriptionService.getSubscribers(
      release.id,
      [...mentions, await this.usersService.getUser(actor.id)]
    )
    let participants = new Set([...subscribers])
    if (
      commentReference.type === ReferenceType.COMMENT &&
      commentReference.id
    ) {
      const commentParticipants = await this.getParticipants(
        queryRunner,
        comment.parent.id,
        [actor.id, ...mentions.map((mention) => mention.id)]
      )
      participants = new Set([...commentParticipants, ...subscribers])
    }

    const commentParentId = comment.parent ? comment.parent.id : comment.id

    await this.sendCommentPushNotification(
      [...participants.values()],
      release.id,
      release.name,
      namespace.name,
      commentId,
      commentParentId,
      commentReference as CheckReference,
      actor.displayName,
      processedContent
    )
    await this.sendMentionsPushNotification(
      mentions.filter((mention) => mention.id !== actor.id),
      release.id,
      release.name,
      namespace.name,
      commentId,
      commentParentId,
      commentReference as CheckReference,
      actor.displayName,
      processedContent
    )
  }

  async updateCommentNotifications(
    namespaceId: number,
    releaseId: number,
    commentId: number,
    oldContent: string,
    actor: RequestUser,
    queryRunner: QueryRunner
  ): Promise<void> {
    const newComment = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      commentId
    )
    const namespace = newComment.namespace
    const release = newComment.release
    const commentReference = this.extractReference(newComment)

    const currentMentions = await this.getMentionsInNamespace(
      namespace.id,
      newComment.content
    )
    const newMentions = await this.getNewMentionsInNamespace(
      namespace.id,
      oldContent,
      newComment.content
    )

    const processedContent = this.replaceMentions(
      newComment.content,
      currentMentions
    )

    const commentParentId = newComment.parent
      ? newComment.parent.id
      : newComment.id

    await this.sendMentionsPushNotification(
      newMentions.filter((mention) => mention.id !== actor.id),
      releaseId,
      release.name,
      namespace.name,
      commentId,
      commentParentId,
      commentReference as CheckReference,
      actor.displayName,
      processedContent
    )
  }

  private async sendCommentPushNotification(
    participants: UserInNamespaceDto[],
    releaseId: number,
    releaseName: string,
    namespaceName: string,
    commentId: number,
    parentCommentId: number,
    checkReference: CheckReference,
    displayName: string,
    content: string
  ) {
    for (const participant of participants) {
      const commentData: CommentData = {
        user_name: participant.firstName
          ? participant.firstName
          : participant.displayName,
        namespace_name: namespaceName,
        release_id: releaseId,
        release_name: releaseName,
        comment_id: commentId,
        parent_comment_id: parentCommentId,
        // No direct link to ReferencyType.RELEASE in UI
        // We rely on the UI to redirect to the first check comment of the release
        chapter_id: checkReference.chapter ? checkReference.chapter : '',
        requirement_id: checkReference.requirement
          ? checkReference.requirement
          : '',
        check_id: checkReference.check ? checkReference.check : '',
        created_by: displayName,
        content: content,
      }

      await this.notificationService.pushNotification(
        participant.id,
        'A new comment was added to your discussion',
        {
          type: NotificationType.Comment,
          data: commentData,
        }
      )
    }
  }

  private async sendMentionsPushNotification(
    mentions: UserInNamespaceDto[],
    releaseId: number,
    releaseName: string,
    namespaceName: string,
    commentId: number,
    parentCommentId: number,
    checkReference: CheckReference,
    displayName: string,
    content: string
  ) {
    for (const mention of mentions) {
      const mentionData: MentionData = {
        user_name: mention.firstName ? mention.firstName : mention.displayName,
        created_by: displayName,
        namespace_name: namespaceName,
        release_id: releaseId,
        release_name: releaseName,
        comment_id: commentId,
        parent_comment_id: parentCommentId,
        // No direct link to ReferencyType.RELEASE in UI
        // We rely on the UI to redirect to the first check comment of the release
        chapter_id: checkReference.chapter ? checkReference.chapter : '',
        requirement_id: checkReference.requirement
          ? checkReference.requirement
          : '',
        check_id: checkReference.check ? checkReference.check : '',
        content: content,
      }

      await this.notificationService.pushNotification(
        mention.id,
        'You have been mentioned in a comment related to a release approval',
        { type: NotificationType.Mention, data: mentionData }
      )
    }
  }

  private async getParticipants(
    queryRunner: QueryRunner,
    threadId: number,
    ignore: string[] = []
  ): Promise<UserInNamespaceDto[]> {
    const participants = new Map<string, UserInNamespaceDto>()
    const comments = await queryRunner.manager.find(CommentEntity, {
      where: [{ parent: { id: threadId } }, { id: threadId }],
      relations: ['parent'],
    })

    for (const comment of comments) {
      participants.set(
        comment.createdBy,
        await this.usersService.getUser(comment.createdBy)
      )
      participants.set(
        comment.lastModifiedBy,
        await this.usersService.getUser(comment.lastModifiedBy)
      )
    }

    participants.delete(SYSTEM_USER.id)
    for (const id of ignore) {
      participants.delete(id)
    }
    return Array.from(participants.values())
  }

  private async getMentionsInNamespace(
    namespaceId: number,
    content: string,
    ignore: UserInNamespaceDto[] = []
  ) {
    const usersInNamespace = await this.usersService.list(namespaceId)
    const mentions = new Map<string, UserInNamespaceDto>()

    /*
     * Check for username-based mentions that may still be in the DB
     */
    const matches = content.matchAll(mentionsDelimiter)

    for (const match of matches) {
      if (match.length && match.length >= 2) {
        const username = match[1]
        const user = usersInNamespace.filter(
          (item) => item.username === username
        )[0]
        if (user) {
          mentions.set(username, user)
        }
      }
    }

    /*
     * Check for id-based mentions that are the new way of doing things
     */
    const idMentionsDelimiter =
      /@([0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12})/g

    const idMatches = content.matchAll(idMentionsDelimiter)

    for (const match of idMatches) {
      if (match.length && match.length >= 2) {
        const id = match[1]
        const user = usersInNamespace.filter((item) => item.id === id)[0]
        if (user) {
          mentions.set(user.username, user)
        }
      }
    }

    for (const user of ignore.values()) {
      mentions.delete(user.username)
    }
    return Array.from(mentions.values())
  }

  private replaceMentions(
    content: string,
    mentions: UserInNamespaceDto[]
  ): string {
    let newContent = content
    const validTagMap = new Map<string, UserInNamespaceDto>()

    for (const mention of mentions.values()) {
      validTagMap.set(`@${mention.username}`, mention)
      validTagMap.set(`@${mention.id}`, mention)
    }

    for (const tag of validTagMap.keys()) {
      const tagRegex = new RegExp(`${tag}`, 'gm')
      newContent = newContent.replace(
        tagRegex,
        `@${validTagMap.get(tag).displayName}`
      )
    }

    return newContent
  }

  private async getNewMentionsInNamespace(
    namespaceId: number,
    originalContent: string,
    newContent: string
  ) {
    const originalMentions = await this.getMentionsInNamespace(
      namespaceId,
      originalContent
    )
    const currentMentions = await this.getMentionsInNamespace(
      namespaceId,
      newContent
    )

    // mentions of every new user in comment
    const newMentions = currentMentions.filter(
      (item2) => !originalMentions.some((item1) => item1.id === item2.id)
    )
    return newMentions
  }

  // TODO: should also be in a config module
  private async verifyCheckExists(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    reference: Reference
  ) {
    if (reference.type !== ReferenceType.CHECK) {
      return
    }

    const qgConfigData = await getQgConfigFileContent(
      queryRunner,
      namespaceId,
      releaseId
    )

    try {
      const chapter = qgConfigData['chapters'][reference.chapter]
      const requirement = chapter['requirements'][reference.requirement]
      const check = requirement['checks'][reference.check]
      if (!check) {
        throw new Error('Check not found')
      }
    } catch (e) {
      throw new NotFoundException(
        `Check not found, namespace: ${namespaceId}, release: ${releaseId}, reference: ${JSON.stringify(
          reference
        )}`
      )
    }
  }

  async replaceIdMentionsWithUsernameMentions(text: string): Promise<string> {
    const idMentionsDelimiter =
      /@([0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12})/g

    const mentions = new Map<string, string>()

    const matches = text.matchAll(idMentionsDelimiter)

    for (const match of matches) {
      const id = match[1]
      const user = await this.usersService.getUser(id)
      mentions.set(id, user.username)
    }

    return text.replace(
      idMentionsDelimiter,
      (match, id, offset, string, groups) => {
        return '@' + mentions.get(id)
      }
    )
  }

  async replaceUsernameMentionsWithIdMentions(text: string): Promise<string> {
    const mentions = new Map<string, string>()

    const matches = text.matchAll(mentionsDelimiter)

    for (const match of matches) {
      const username = match[1]
      const user = await this.usersService.getUser(username)
      if (user.id === SYSTEM_REQUEST_USER_ID || user.id === DELETED_USER.id) {
        // if we receive something from the outside which we cannot properly resolve, we do not replace it
        mentions.set(username, username)
      } else {
        mentions.set(username, user.id)
      }
    }

    return text.replace(
      mentionsDelimiter,
      (match, username, offset, string, groups) => {
        return '@' + mentions.get(username)
      }
    )
  }

  async toCommentDto(comment: CommentEntity): Promise<CommentDto> {
    const dto = new CommentDto()
    dto.id = comment.id
    dto.content = await this.replaceIdMentionsWithUsernameMentions(
      comment.content
    )
    dto.todo = comment.todo
    dto.status = comment.status
    dto.createdBy = await this.usersService.getUser(comment.createdBy)
    dto.lastModifiedBy = await this.usersService.getUser(comment.lastModifiedBy)
    dto.creationTime = comment.creationTime
    dto.lastModificationTime = comment.lastModificationTime
    const referenceType = comment.referenceType

    switch (referenceType) {
      case ReferenceType.CHECK:
        dto.reference = {
          type: ReferenceType.CHECK,
          chapter: comment.reference.chapter,
          requirement: comment.reference.requirement,
          check: comment.reference.check,
        }
        break
      case ReferenceType.RELEASE:
        dto.reference = { type: ReferenceType.RELEASE }
        break
      case ReferenceType.COMMENT:
        dto.reference = { type: ReferenceType.COMMENT, id: comment.parent?.id }
        break
      case ReferenceType.APPROVAL:
        dto.reference = { type: ReferenceType.APPROVAL }
        break
      default:
        this.shouldBeUnreachable(referenceType)
    }
    return dto
  }

  extractReference(comment: CommentEntity): Reference {
    const referenceType = comment.referenceType
    switch (referenceType) {
      case ReferenceType.CHECK:
        return {
          type: ReferenceType.CHECK,
          chapter: comment.reference.chapter,
          requirement: comment.reference.requirement,
          check: comment.reference.check,
        }
      case ReferenceType.COMMENT:
        // TODO: there is a case where the comment has no parent, i.e reply to a ReferenceType.COMMENT will throw 500
        return { type: ReferenceType.COMMENT, id: comment.parent.id }
      case ReferenceType.RELEASE:
        return { type: ReferenceType.RELEASE }
      case ReferenceType.APPROVAL:
        return { type: ReferenceType.APPROVAL }
      default:
        this.shouldBeUnreachable(referenceType)
    }
  }

  async toCommentWithRepliesDto(
    comment: CommentEntity
  ): Promise<CommentWithRepliesDto> {
    const dto = new CommentWithRepliesDto()
    dto.id = comment.id
    dto.content = await this.replaceIdMentionsWithUsernameMentions(
      comment.content
    )
    dto.todo = comment.todo
    dto.status = comment.status
    dto.createdBy = await this.usersService.getUser(comment.createdBy)
    dto.lastModifiedBy = await this.usersService.getUser(comment.lastModifiedBy)
    dto.creationTime = comment.creationTime
    dto.lastModificationTime = comment.lastModificationTime
    if (comment.children) {
      dto.replies = await Promise.all(
        comment.children.map(async (reply) => await this.toCommentDto(reply))
      )
    } else {
      dto.replies = []
    }
    return dto
  }

  async toCommentWithRepliesAndReferenceDto(
    comment: CommentEntity
  ): Promise<CommentWithRepliesAndReferenceDto> {
    const dto = new CommentWithRepliesAndReferenceDto()
    dto.id = comment.id
    dto.content = await this.replaceIdMentionsWithUsernameMentions(
      comment.content
    )
    dto.todo = comment.todo
    dto.status = comment.status
    dto.createdBy = await this.usersService.getUser(comment.createdBy)
    dto.lastModifiedBy = await this.usersService.getUser(comment.lastModifiedBy)
    dto.creationTime = comment.creationTime
    dto.lastModificationTime = comment.lastModificationTime
    if (comment.children) {
      dto.replies = await Promise.all(
        comment.children.map(async (reply) => await this.toCommentDto(reply))
      )
    } else {
      dto.replies = []
    }
    dto.reference = this.extractReference(comment)
    return dto
  }

  async toEntityList(
    comments: EntityList<CommentEntity>
  ): Promise<EntityList<CommentWithRepliesAndReferenceDto>> {
    const commentsWithReplies = await Promise.all(
      comments.entities.map(
        async (comment) =>
          await this.toCommentWithRepliesAndReferenceDto(comment)
      )
    )
    return { entities: commentsWithReplies, itemCount: comments.itemCount }
  }

  async toCommentsByReferenceDto(
    comments: CommentEntity[],
    reference: Reference
  ): Promise<CommentsByReferenceDto> {
    const dto = new CommentsByReferenceDto()
    dto.root = reference
    dto.comments = await Promise.all(
      comments.map(
        async (comment) => await this.toCommentWithRepliesDto(comment)
      )
    )
    return dto
  }

  // Sentinel function for switch-case statements
  // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
  shouldBeUnreachable(value: never) {}
}
