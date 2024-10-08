import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UserInNamespaceDto } from 'src/namespace/users/users.utils'
import { EntityNotFoundError, QueryRunner, Repository } from 'typeorm'
import { CheckOverrideData } from '../../../mailing/mailing.service'
import { NotificationType } from '../../../mailing/mailing.utils'
import { RequestUser } from '../../../namespace/module.utils'
import { SubscriptionService } from '../../../namespace/subscriptions/subscription.service'
import { NotificationService } from '../../../notifications/notification.service'
import { Action, AuditActor } from '../../audit/audit.entity'
import { Namespace } from '../../namespace/namespace.entity'
import { UsersService } from '../../users/users.service'
import {
  checkForClosed,
  getQgConfigFileContent,
  getRelease,
} from '../module.utils'
import { OverrideAuditService, OverrideEntity } from './override.entity'
import { CheckColor, CheckReference, OverrideDto } from './overrides.utils'

@Injectable()
export class OverridesService {
  constructor(
    @InjectRepository(OverrideEntity)
    private readonly repository: Repository<OverrideEntity>,
    @Inject(OverrideAuditService)
    private readonly auditService: OverrideAuditService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(SubscriptionService)
    private readonly subscriptionService: SubscriptionService,
    @Inject(NotificationService)
    private readonly notificationService: NotificationService
  ) {}

  async getAll(namespaceId: number, releaseId: number): Promise<OverrideDto[]> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const entities = await this.getAllWithTransaction(
        queryRunner,
        namespaceId,
        releaseId
      )
      const dtos = entities.map((e) => this.toOverrideDto(e))
      await queryRunner.commitTransaction()
      return dtos
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async getAllWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number
  ): Promise<OverrideEntity[]> {
    const entities = await queryRunner.manager.find(OverrideEntity, {
      where: {
        release: { id: releaseId },
        namespace: { id: namespaceId },
      },
      relations: ['namespace', 'release'],
    })

    return entities
  }

  async create(
    namespaceId: number,
    releaseId: number,
    chapter: string,
    requirement: string,
    check: string,
    originalColor: CheckColor,
    manualColor: CheckColor,
    comment: string,
    actor: RequestUser
  ): Promise<OverrideDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const entity = await this.createWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        chapter,
        requirement,
        check,
        originalColor,
        manualColor,
        comment,
        actor
      )
      const dto = await this.toOverrideDto(entity)
      await queryRunner.commitTransaction()
      return dto
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
    chapter: string,
    requirement: string,
    check: string,
    originalColor: CheckColor,
    manualColor: CheckColor,
    comment: string,
    actor: RequestUser
  ): Promise<OverrideEntity> {
    const namespace = await queryRunner.manager.findOneOrFail(Namespace, {
      where: { id: namespaceId },
    })
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const nowDate = new Date()
    const newOverride = new OverrideEntity()
    newOverride.namespace = namespace
    newOverride.release = release
    newOverride.createdBy = actor.id
    newOverride.lastModifiedBy = actor.id
    newOverride.creationTime = nowDate
    newOverride.lastModificationTime = nowDate

    newOverride.chapter = chapter
    newOverride.requirement = requirement
    newOverride.check = check

    newOverride.originalColor = originalColor
    newOverride.manualColor = manualColor
    newOverride.comment = comment

    const override = await queryRunner.manager.save(newOverride)
    await this.auditService.append(
      namespaceId,
      override.id,
      {},
      override.DeepCopyWithoutRelations(),
      AuditActor.convertFrom(actor),
      Action.CREATE,
      queryRunner.manager
    )

    await this.notifySubscribers(
      queryRunner,
      namespaceId,
      releaseId,
      newOverride,
      newOverride.manualColor,
      actor
    )

    return override
  }

  async update(
    namespaceId: number,
    releaseId: number,
    overrideId: number,
    originalColor: CheckColor,
    manualColor: CheckColor,
    comment: string,
    actor: RequestUser
  ): Promise<OverrideDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const entity = await this.updateWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        overrideId,
        originalColor,
        manualColor,
        comment,
        actor
      )
      const dto = await this.toOverrideDto(entity)
      await queryRunner.commitTransaction()
      return dto
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
    overrideId: number,
    originalColor: CheckColor,
    manualColor: CheckColor,
    comment: string,
    actor: RequestUser
  ): Promise<OverrideEntity> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const nowDate = new Date()

    const originalOverride = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      overrideId
    )

    const newOverride = originalOverride.DeepCopy()

    if (originalColor !== originalOverride.originalColor) {
      newOverride.originalColor = originalColor
    }

    const manualColorChanged = manualColor !== originalOverride.manualColor
    if (manualColorChanged) {
      newOverride.manualColor = manualColor
    }

    newOverride.comment = comment

    newOverride.lastModifiedBy = actor.id
    newOverride.lastModificationTime = nowDate

    const override = await queryRunner.manager.save(newOverride)
    await this.auditService.append(
      namespaceId,
      override.id,
      originalOverride.DeepCopyWithoutRelations(),
      override.DeepCopyWithoutRelations(),
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager
    )

    if (manualColorChanged) {
      await this.notifySubscribers(
        queryRunner,
        namespaceId,
        releaseId,
        newOverride,
        newOverride.manualColor,
        actor
      )
    }

    return override
  }

  toOverrideDto(entity: OverrideEntity) {
    const dto = new OverrideDto()

    dto.id = entity.id
    dto.reference = new CheckReference(
      entity.chapter,
      entity.requirement,
      entity.check
    )

    dto.originalColor = entity.originalColor
    dto.manualColor = entity.manualColor

    dto.comment = entity.comment

    dto.lastModificationTime = entity.lastModificationTime
    dto.userId = entity.lastModifiedBy

    return dto
  }

  async getWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    overrideId: number
  ): Promise<OverrideEntity> {
    const override = await queryRunner.manager.findOneOrFail(OverrideEntity, {
      where: {
        id: overrideId,
        release: { id: releaseId },
        namespace: { id: namespaceId },
      },
      relations: ['namespace', 'release'],
    })

    return override
  }

  async remove(
    namespaceId: number,
    releaseId: number,
    overrideId: number,
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
        overrideId,
        actor
      )
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(
          `Override not found in release, release ${releaseId}, override ${overrideId}`
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
    overrideId: number,
    actor: RequestUser
  ): Promise<void> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const original = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      overrideId
    )

    if (!original) {
      throw new Error('Unexpected state when retrieving override')
    }

    await queryRunner.manager.delete(OverrideEntity, {
      namespace: { id: namespaceId },
      release: { id: releaseId },
      id: overrideId,
    })

    await this.auditService.append(
      namespaceId,
      overrideId,
      original.DeepCopyWithoutRelations(),
      {},
      AuditActor.convertFrom(actor),
      Action.DELETE,
      queryRunner.manager
    )

    await this.notifySubscribers(
      queryRunner,
      namespaceId,
      releaseId,
      original,
      original.originalColor,
      actor
    )
  }

  async removeAllWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    actor: RequestUser
  ): Promise<void> {
    const overrides = await queryRunner.manager.find(OverrideEntity, {
      where: {
        release: { id: releaseId },
        namespace: { id: namespaceId },
      },
      relations: ['namespace', 'release'],
    })

    /*
     * This method is only called on release removal.
     */

    for (const override of overrides) {
      await this.auditService.append(
        namespaceId,
        releaseId,
        override.DeepCopyWithoutRelations(),
        {},
        AuditActor.convertFrom(actor),
        Action.DELETE,
        queryRunner.manager
      )

      await queryRunner.manager.remove(override)
    }
  }

  private async notifySubscribers(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    override: OverrideEntity,
    newColor: CheckColor,
    actor: RequestUser
  ): Promise<void> {
    // converting the actor to be ignored in the notification
    const actorUser = {
      id: actor.id,
    } as UserInNamespaceDto
    const subscribers = await this.subscriptionService.getSubscribers(
      releaseId,
      [actorUser]
    )
    const checkTitle = await this.getCheckTitle(
      namespaceId,
      releaseId,
      override,
      queryRunner
    )
    for (const subscriber of subscribers) {
      await this.pushOverrideNotification(
        subscriber,
        override,
        newColor,
        checkTitle
      )
    }
  }

  private async getCheckTitle(
    namespaceId: number,
    releaseId: number,
    override: OverrideEntity,
    queryRunner: QueryRunner
  ): Promise<string | undefined> {
    const qgConfigData = await getQgConfigFileContent(
      queryRunner,
      namespaceId,
      releaseId
    )

    const reference = {
      chapter: override.chapter,
      requirement: override.requirement,
      check: override.check,
    }

    try {
      const chapter = qgConfigData['chapters'][reference.chapter]
      const requirement = chapter['requirements'][reference.requirement]
      const check = requirement['checks'][reference.check]
      return check['title']
    } catch (e) {
      // This can only happen if the qg-config.yaml file has changed since the override was created
      // In this case we dont populate the check title
      return undefined
    }
  }

  private async pushOverrideNotification(
    subscriber: UserInNamespaceDto,
    override: OverrideEntity,
    check_status: string,
    check_title?: string
  ): Promise<void> {
    const modifier = await this.usersService.getUser(override.lastModifiedBy)
    const data: CheckOverrideData = {
      user_name: subscriber.firstName
        ? subscriber.firstName
        : subscriber.displayName,
      namespace_name: override.namespace.name,
      release_id: override.release.id,
      release_name: override.release.name,
      chapter_id: override.chapter,
      requirement_id: override.requirement,
      check_id: override.check,
      check_title: check_title,
      check_status: check_status,
      modified_by: modifier.firstName
        ? modifier.firstName
        : modifier.displayName,
    }
    await this.notificationService.pushNotification(
      subscriber.id,
      'User is Subscriber to a Release that has a check result manually changed',
      {
        type: NotificationType.CheckOverride,
        data,
      }
    )
  }
}
