import { EntityList, ListQueryHandler } from '@B-S-F/api-commons-lib'
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityNotFoundError, QueryRunner, Repository } from 'typeorm'
import { RequestUser } from '../../../namespace/module.utils'
import { Action, AuditActor } from '../../audit/audit.entity'
import { Namespace } from '../../namespace/namespace.entity'
import { UsersService } from '../../users/users.service'
import { CommentsService } from '../comments/comments.service'
import { ReferenceType } from '../comments/comments.utils'
import { checkForClosed, getRelease } from '../module.utils'
import {
  ApprovalMode,
  ReleaseAuditService,
  ReleaseEntity,
} from '../release.entity'
import { ApprovalAuditService, ApprovalEntity } from './approvals.entity'
import { ApprovalDto, ApprovalState } from './approvals.util'
import { SubscriptionService } from '../../subscriptions/subscription.service'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import {
  ApprovalData,
  ApprovalStateData,
} from '../../../mailing/mailing.service'
import { NotificationService } from '../../../notifications/notification.service'
import { NotificationType } from '../../../mailing/mailing.utils'
import { UserInNamespaceDto } from '../../../namespace/users/users.utils'

@Injectable()
export class ApprovalService {
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
    @InjectRepository(ApprovalEntity)
    private readonly repository: Repository<ApprovalEntity>,
    @Inject(ApprovalAuditService)
    private readonly auditService: ApprovalAuditService,
    @Inject(ReleaseAuditService)
    private readonly releaseAuditService: ReleaseAuditService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(CommentsService)
    private readonly commentsService: CommentsService,
    @Inject(SubscriptionService)
    private readonly subscriptionService: SubscriptionService,
    @Inject(NotificationService)
    private readonly notificationService: NotificationService
  ) {}

  async get(
    namespaceId: number,
    releaseId: number,
    approverId: number
  ): Promise<ApprovalDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const entity = await this.getWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        approverId
      )
      const dto = await this.toApprovalDto(entity)
      await queryRunner.commitTransaction()
      return dto
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
    approverId: number
  ): Promise<ApprovalEntity> {
    const approver = await queryRunner.manager.findOneOrFail(ApprovalEntity, {
      where: {
        id: approverId,
        release: { id: releaseId },
        namespace: { id: namespaceId },
      },
      relations: ['namespace', 'release'],
    })

    return approver
  }

  async list(
    namespaceId: number,
    releaseId: number,
    listQueryHandler: ListQueryHandler
  ): Promise<EntityList<ApprovalDto>> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ COMMITTED')
    try {
      const releases = await this.listWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        listQueryHandler
      )
      const entityList = await this.toEntityList(releases)
      await queryRunner.commitTransaction()
      return entityList
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async listWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    listQueryHandler: ListQueryHandler
  ): Promise<EntityList<ApprovalEntity>> {
    const queryBuilder = queryRunner.manager
      .getRepository(ApprovalEntity)
      .createQueryBuilder('approvals')
      .leftJoinAndSelect('approvals.namespace', 'Namespace')
      .leftJoinAndSelect('approvals.release', 'Release')
      .where('approvals.namespace.id = :namespaceId', { namespaceId })
      .where('approvals.release.id = :releaseId', { releaseId })

    listQueryHandler.addToQueryBuilder<ApprovalEntity>(
      queryBuilder,
      'approvals'
    )

    const itemCount = await queryBuilder.getCount()
    const { entities } = await queryBuilder.getRawAndEntities()

    return {
      entities,
      itemCount,
    }
  }

  async addApprover(
    namespaceId: number,
    releasedId: number,
    approver: string,
    actor: RequestUser
  ): Promise<ApprovalDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ UNCOMMITTED')
      const entity = await this.addApproverWithTransaction(
        queryRunner,
        namespaceId,
        releasedId,
        approver,
        actor
      )
      const dto = await this.toApprovalDto(entity)
      await queryRunner.commitTransaction()

      await this.addApproverNotification(
        namespaceId,
        releasedId,
        dto.id,
        actor,
        queryRunner
      )

      return dto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async toApprovalDto(entity: ApprovalEntity): Promise<ApprovalDto> {
    const dto = new ApprovalDto()
    dto.id = entity.id
    dto.state = entity.approvalState
    dto.user = await this.usersService.getUser(entity.approver)
    return dto
  }

  async addApproverWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    approver: string,
    actor: RequestUser
  ): Promise<ApprovalEntity> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const users = await this.usersService.list(namespaceId)
    let foundUserInNamespace = false
    let approverId
    for (const userInNamespace of users) {
      if (
        userInNamespace.id === approver ||
        userInNamespace.username === approver
      ) {
        foundUserInNamespace = true
        approverId = userInNamespace.id
        break
      }
    }

    if (!foundUserInNamespace) {
      throw new BadRequestException(
        `Approver not found in namespace, namespace: ${namespaceId}, approver: ${approver}`
      )
    }

    const nowDate = new Date()
    const newApproval = new ApprovalEntity()
    newApproval.namespace = { id: namespaceId } as Namespace
    newApproval.release = { id: releaseId } as ReleaseEntity
    newApproval.approver = approver
    newApproval.approvalState = ApprovalState.PENDING
    newApproval.createdBy = actor.id
    newApproval.lastModifiedBy = actor.id
    newApproval.creationTime = nowDate
    newApproval.lastModificationTime = nowDate
    const approval = await queryRunner.manager.save(newApproval)
    await this.auditService.append(
      namespaceId,
      approval.id,
      {},
      approval,
      AuditActor.convertFrom(actor),
      Action.CREATE,
      queryRunner.manager
    )
    const approvals = await queryRunner.manager.find(ApprovalEntity, {
      where: {
        release: { id: releaseId },
        namespace: { id: namespaceId },
      },
      relations: ['namespace', 'release'],
    })

    const newReleaseApprovalState = await this.computeAggregateApproval(
      release.approvalMode,
      approvals
    )

    await this.updateReleaseApprovalState(
      queryRunner,
      namespaceId,
      releaseId,
      release,
      newReleaseApprovalState,
      actor
    )
    const subscribtionResult =
      await this.subscriptionService.getSubscriptionStatus(
        approverId,
        releaseId
      )
    if (!subscribtionResult) {
      await this.subscriptionService.createSubscription(approverId, releaseId)
    }

    return approval
  }

  async approve(
    namespaceId: number,
    releaseId: number,
    comment: string,
    actor: RequestUser
  ): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const res = await this.updateApprovalStateWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        ApprovalState.APPROVED,
        comment,
        actor
      )
      await queryRunner.commitTransaction()
      return res
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
    comment: string,
    actor: RequestUser
  ): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const res = await this.updateApprovalStateWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        ApprovalState.PENDING,
        comment,
        actor
      )
      await queryRunner.commitTransaction()
      return res
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async updateApprovalStateWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    approvalState: ApprovalState,
    comment: string,
    actor: RequestUser
  ): Promise<void> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const currentApproval = await queryRunner.manager.findOneOrFail(
      ApprovalEntity,
      {
        where: {
          approver: actor.id,
          release: { id: releaseId },
          namespace: { id: namespaceId },
        },
        relations: ['namespace', 'release', 'comment'],
      }
    )

    if (currentApproval.approvalState === approvalState) return

    const original = currentApproval.DeepCopy()
    const nowDate = new Date()

    const commentReference = {
      type: ReferenceType.APPROVAL,
    }
    const createdComment = await this.commentsService.createWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      commentReference,
      comment,
      false,
      actor
    )

    currentApproval.approvalState = approvalState
    currentApproval.lastModifiedBy = actor.id
    currentApproval.lastModificationTime = nowDate
    currentApproval.comment = createdComment

    const newApproval = await queryRunner.manager.save(currentApproval)
    await this.auditService.append(
      namespaceId,
      currentApproval.id,
      original,
      newApproval,
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager
    )

    const approvals = await queryRunner.manager.find(ApprovalEntity, {
      where: {
        release: { id: releaseId },
        namespace: { id: namespaceId },
      },
      relations: ['namespace', 'release'],
    })

    const newReleaseApprovalState = this.computeAggregateApproval(
      release.approvalMode,
      approvals
    )

    await this.updateReleaseApprovalState(
      queryRunner,
      namespaceId,
      releaseId,
      release,
      newReleaseApprovalState,
      actor
    )
  }

  async remove(
    namespaceId: number,
    releaseId: number,
    approverId: number,
    actor: RequestUser
  ): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ COMMITTED')
    try {
      await this.removeWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        approverId,
        actor
      )
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(
          `Approver not found in release, release ${releaseId}, approver ${approverId}`
        )
      }
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async removeWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    approverId: number,
    actor: RequestUser
  ): Promise<void> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const original = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      approverId
    )

    if (!original) {
      throw new Error('Unexpected state when retrieving approver')
    }

    await queryRunner.manager.delete(ApprovalEntity, {
      namespace: { id: namespaceId },
      release: { id: releaseId },
      id: approverId,
    })

    await this.auditService.append(
      namespaceId,
      approverId,
      original,
      {},
      AuditActor.convertFrom(actor),
      Action.DELETE,
      queryRunner.manager
    )

    const approvals = await queryRunner.manager.find(ApprovalEntity, {
      where: {
        release: { id: releaseId },
        namespace: { id: namespaceId },
      },
      relations: ['namespace', 'release'],
    })

    const newReleaseApprovalState = this.computeAggregateApproval(
      release.approvalMode,
      approvals
    )

    await this.updateReleaseApprovalState(
      queryRunner,
      namespaceId,
      releaseId,
      release,
      newReleaseApprovalState,
      actor
    )
  }

  async removeAllWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    actor: RequestUser
  ): Promise<void> {
    const approvals = await queryRunner.manager.find(ApprovalEntity, {
      where: {
        release: { id: releaseId },
        namespace: { id: namespaceId },
      },
      relations: ['namespace', 'release'],
    })

    for (const approval of approvals) {
      await this.auditService.append(
        namespaceId,
        releaseId,
        approval.DeepCopy(),
        {},
        AuditActor.convertFrom(actor),
        Action.DELETE,
        queryRunner.manager
      )

      await queryRunner.manager.remove(approval)
    }
  }

  async getApprovalStateWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    mode: ApprovalMode
  ): Promise<ApprovalState> {
    const approvals = await queryRunner.manager.find(ApprovalEntity, {
      where: {
        release: { id: releaseId },
        namespace: { id: namespaceId },
      },
      relations: ['namespace', 'release'],
    })

    return this.computeAggregateApproval(mode, approvals)
  }

  computeAggregateApproval(
    mode: ApprovalMode,
    approvals: ApprovalEntity[]
  ): ApprovalState {
    if (approvals.length === 0) {
      return ApprovalState.PENDING
    }

    const states = approvals.map((approval) => approval.approvalState)

    return this.isApproved(mode, states)
      ? ApprovalState.APPROVED
      : ApprovalState.PENDING
  }

  private isApproved(
    approvalMode: ApprovalMode,
    states: ApprovalState[]
  ): boolean {
    if (states.length === 0) {
      throw new Error('Illegal argument, approvals may not be empty')
    }

    switch (approvalMode) {
      case 'all':
        return states.every((states) => states == ApprovalState.APPROVED)
      case 'one':
        return states.some((states) => states == ApprovalState.APPROVED)
      default:
        throw new Error('Implementation bug')
    }
  }

  async toEntityList(
    approvals: EntityList<ApprovalEntity>
  ): Promise<EntityList<ApprovalDto>> {
    const dtos = await Promise.all(
      approvals.entities.map(async (approval) => {
        return await this.toApprovalDto(approval)
      })
    )
    return {
      entities: dtos,
      itemCount: approvals.itemCount,
    }
  }

  async updateReleaseApprovalState(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    currentRelease: ReleaseEntity,
    newApprovalState: ApprovalState,
    actor: RequestUser
  ): Promise<void> {
    if (newApprovalState === currentRelease.approvalState) {
      return
    }

    const originalRelease = currentRelease.DeepCopy()

    const nowDate = new Date()
    currentRelease.lastModifiedBy = actor.id
    currentRelease.lastModificationTime = nowDate
    currentRelease.approvalState = newApprovalState

    const release = await queryRunner.manager.save(currentRelease)
    // Populate id that was left out by the queryRunner
    release.config.id = currentRelease.config.id

    await this.releaseAuditService.append(
      namespaceId,
      releaseId,
      originalRelease,
      release,
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager
    )

    await this.updateReleaseApprovalStateNotification(
      releaseId,
      release.name,
      release.namespace.name,
      actor.displayName,
      currentRelease.approvalState
    )
  }

  private async updateReleaseApprovalStateNotification(
    releaseId: number,
    releaseName: string,
    namespaceName: string,
    displayName: string,
    approvalState: ApprovalState
  ) {
    const subscribers = await this.subscriptionService.getSubscribers(releaseId)
    for (const subscriber of subscribers) {
      const approvalData: ApprovalStateData = {
        user_name: subscriber.firstName
          ? subscriber.firstName
          : subscriber.displayName,
        changed_by: displayName,
        namespace_name: namespaceName,
        release_id: releaseId,
        release_name: releaseName,
        status: approvalState,
      }
      await this.notificationService.pushNotification(
        subscriber.id,
        'The approval status of a release you are subscribed to has changed',
        { type: NotificationType.ApprovalState, data: approvalData }
      )
    }
  }

  async addApproverNotification(
    namespaceId: number,
    releaseId: number,
    approverId: number,
    actor: RequestUser,
    queryRunner: QueryRunner
  ) {
    const approval = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      approverId
    )
    const namespace = approval.namespace
    const release = approval.release
    const approver = await this.usersService.getUser(approval.approver)

    const approvalData: ApprovalData = {
      user_name: approver.firstName ? approver.firstName : approver.displayName,
      added_by: actor.displayName,
      release_id: releaseId,
      release_name: release.name,
      namespace_name: namespace.name,
    }

    await this.notificationService.pushNotification(
      approver.id,
      'You have been selected as an approver for a release',
      {
        type: NotificationType.Approval,
        data: approvalData,
      }
    )
  }
}
