import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryRunner, Repository } from 'typeorm'
import { Action, AuditActor } from '../../../../namespace/audit/audit.entity'
import { RequestUser } from '../../../../namespace/module.utils'
import { Namespace } from '../../../../namespace/namespace/namespace.entity'
import { UsersService } from '../../../../namespace/users/users.service'
import { checkForClosed, getRelease } from '../../module.utils'
import { OverrideAuditService, OverrideEntity } from '../override.entity'
import {
  CheckResultOverrideAuditService,
  CheckResultOverrideEntity,
} from './check-result-override.entity'
import { CheckResultOverrideDto } from './check-result-override.utils'

@Injectable()
export class CheckResultOverridesService {
  constructor(
    @InjectRepository(CheckResultOverrideEntity)
    private readonly repository: Repository<OverrideEntity>,
    @Inject(CheckResultOverrideAuditService)
    private readonly auditService: OverrideAuditService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  async getAll(
    namespaceId: number,
    releaseId: number,
  ): Promise<CheckResultOverrideDto[]> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()
      const entities = await this.getAllWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
      )
      const dtos = entities.map((e) => this.toOverrideDto(e))
      await queryRunner.commitTransaction()
      return dtos
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  async getAllWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
  ): Promise<CheckResultOverrideEntity[]> {
    const entities = await queryRunner.manager.find(CheckResultOverrideEntity, {
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
    hash: string,
    originalFulfilled: boolean,
    manualFulfilled: boolean,
    comment: string,
    actor: RequestUser,
  ): Promise<CheckResultOverrideDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()
      const entity = await this.createWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        chapter,
        requirement,
        check,
        hash,
        originalFulfilled,
        manualFulfilled,
        comment,
        actor,
      )
      const dto = this.toOverrideDto(entity)
      await queryRunner.commitTransaction()
      return dto
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
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
    hash: string,
    originalFulfilled: boolean,
    manualFulfilled: boolean,
    comment: string,
    actor: RequestUser,
  ): Promise<CheckResultOverrideEntity> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const nowDate = new Date()
    const newOverride = new CheckResultOverrideEntity()
    newOverride.namespace = { id: namespaceId } as Namespace
    newOverride.release = release
    newOverride.createdBy = actor.id
    newOverride.lastModifiedBy = actor.id
    newOverride.creationTime = nowDate
    newOverride.lastModificationTime = nowDate

    newOverride.chapter = chapter
    newOverride.requirement = requirement
    newOverride.check = check
    newOverride.hash = hash

    newOverride.originalFulfilled = originalFulfilled
    newOverride.manualFulfilled = manualFulfilled
    newOverride.comment = comment

    const override = await queryRunner.manager.save(newOverride)
    await this.auditService.append(
      namespaceId,
      override.id,
      {},
      override.DeepCopyWithoutRelations(),
      AuditActor.convertFrom(actor),
      Action.CREATE,
      queryRunner.manager,
    )

    return override
  }

  async update(
    namespaceId: number,
    releaseId: number,
    overrideId: number,
    originalFulfilled: boolean,
    manualFulfilled: boolean,
    comment: string,
    actor: RequestUser,
  ): Promise<CheckResultOverrideDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()
      const entity = await this.updateWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        overrideId,
        originalFulfilled,
        manualFulfilled,
        comment,
        actor,
      )
      const dto = this.toOverrideDto(entity)
      await queryRunner.commitTransaction()
      return dto
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  async updateWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    overrideId: number,
    originalFulfilled: boolean,
    manualFulfilled: boolean,
    comment: string,
    actor: RequestUser,
  ): Promise<CheckResultOverrideEntity> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const nowDate = new Date()

    const originalOverride = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      overrideId,
    )

    const newOverride = originalOverride.DeepCopy()

    newOverride.originalFulfilled = originalFulfilled
    newOverride.manualFulfilled = manualFulfilled
    newOverride.comment = comment

    newOverride.lastModifiedBy = actor.id
    newOverride.lastModificationTime = nowDate

    await queryRunner.manager.save(newOverride)
    await this.auditService.append(
      namespaceId,
      overrideId,
      originalOverride.DeepCopyWithoutRelations(),
      newOverride.DeepCopyWithoutRelations(),
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager,
    )

    return newOverride
  }

  toOverrideDto(entity: CheckResultOverrideEntity) {
    const dto = new CheckResultOverrideDto()

    dto.id = entity.id
    dto.reference = {
      chapter: entity.chapter,
      requirement: entity.requirement,
      check: entity.check,
      hash: entity.hash,
    }

    dto.originalFulfilled = entity.originalFulfilled
    dto.manualFulfilled = entity.manualFulfilled

    dto.comment = entity.comment

    dto.lastModificationTime = entity.lastModificationTime
    dto.userId = entity.lastModifiedBy

    return dto
  }

  async getWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    overrideId: number,
  ): Promise<CheckResultOverrideEntity> {
    const override = await queryRunner.manager.findOneOrFail(
      CheckResultOverrideEntity,
      {
        where: {
          id: overrideId,
          release: { id: releaseId },
          namespace: { id: namespaceId },
        },
        relations: ['namespace', 'release'],
      },
    )

    return override
  }

  async remove(
    namespaceId: number,
    releaseId: number,
    overrideId: number,
    actor: RequestUser,
  ): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()
      await this.removeWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        overrideId,
        actor,
      )
      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  async removeWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    overrideId: number,
    actor: RequestUser,
  ): Promise<void> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const override = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      overrideId,
    )

    await queryRunner.manager.remove(override)
    await this.auditService.append(
      namespaceId,
      overrideId,
      override.DeepCopyWithoutRelations(),
      {},
      AuditActor.convertFrom(actor),
      Action.DELETE,
      queryRunner.manager,
    )
  }

  async removeAllWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    actor: RequestUser,
  ): Promise<void> {
    const overrides = await queryRunner.manager.find(
      CheckResultOverrideEntity,
      {
        where: {
          release: { id: releaseId },
          namespace: { id: namespaceId },
        },
        relations: ['namespace', 'release'],
      },
    )

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
        queryRunner.manager,
      )

      await queryRunner.manager.remove(override)
    }
  }
}
