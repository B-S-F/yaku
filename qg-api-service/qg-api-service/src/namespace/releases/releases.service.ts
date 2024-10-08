import { EntityList, ListQueryHandler } from '@B-S-F/api-commons-lib'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, LessThan, QueryRunner, Repository } from 'typeorm'
import { Action, AuditActor } from '../audit/audit.entity'
import { ConfigEntity } from '../configs/config.entity'
import { RequestUser } from '../module.utils'
import { Namespace } from '../namespace/namespace.entity'
import { Run } from '../run/run.entity'
import { UsersService } from '../users/users.service'
import { ApprovalEntity } from './approvals/approvals.entity'
import { ApprovalService } from './approvals/approvals.service'
import { ApprovalState } from './approvals/approvals.util'
import { CommentsService } from './comments/comments.service'
import { checkForClosed } from './module.utils'
import { OverridesService } from './overrides/overrides.service'
import {
  ApprovalMode,
  ReleaseAuditService,
  ReleaseEntity,
} from './release.entity'
import { AggregateApprovalDto, ReleaseDto } from './releases.utils'
import { TaskService } from './tasks/tasks.service'

@Injectable()
export class ReleasesService {
  constructor(
    @InjectRepository(ReleaseEntity)
    private readonly repository: Repository<ReleaseEntity>,
    @Inject(ReleaseAuditService)
    private readonly auditService: ReleaseAuditService,
    @Inject(ApprovalService)
    private readonly approvalService: ApprovalService,
    @Inject(CommentsService)
    private readonly commentsService: CommentsService,
    @Inject(OverridesService)
    private readonly overridesService: OverridesService,
    @Inject(TaskService)
    private readonly taskService: TaskService,
    @InjectRepository(Run)
    private readonly runRepository: Repository<Run>,
    @Inject(UsersService)
    private readonly usersService: UsersService
  ) {}

  async list(
    namespaceId: number,
    listQueryHandler: ListQueryHandler
  ): Promise<EntityList<ReleaseDto>> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ COMMITTED')
    try {
      const { releases, approvals } = await this.listWithTransaction(
        queryRunner,
        namespaceId,
        listQueryHandler
      )
      const entityList = await this.toEntityList(releases, approvals)
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
    listQueryHandler: ListQueryHandler
  ): Promise<{
    releases: EntityList<ReleaseEntity>
    approvals: EntityList<ApprovalEntity>
  }> {
    if (!namespaceId || namespaceId <= 0) {
      throw new Error('Invalid namespace id passed')
    }
    const queryBuilder = queryRunner.manager
      .getRepository(ReleaseEntity)
      .createQueryBuilder('releases')
      .leftJoinAndSelect('releases.namespace', 'Namespace')
      .leftJoinAndSelect('releases.config', 'Config')
      .where('releases.namespace.id = :namespaceId', { namespaceId })

    listQueryHandler.addToQueryBuilder<ReleaseEntity>(queryBuilder, 'releases')

    const itemCount = await queryBuilder.getCount()
    const { entities } = await queryBuilder.getRawAndEntities()

    const approvals = await queryRunner.manager
      .getRepository(ApprovalEntity)
      .find({
        where: {
          namespace: { id: namespaceId },
          release: In(entities.map((release) => release.id)),
        },
        relations: ['namespace', 'release'],
      })

    return {
      releases: {
        entities,
        itemCount,
      },
      approvals: {
        entities: approvals,
        itemCount: approvals.length,
      },
    }
  }

  async get(namespaceId: number, releaseId: number): Promise<ReleaseDto> {
    const querryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await querryRunner.connect()
      await querryRunner.startTransaction('READ COMMITTED')
      const release = await this.getWithTransaction(
        querryRunner,
        namespaceId,
        releaseId
      )
      const approvalState = await this.getApprovalStateWithTransaction(
        querryRunner,
        namespaceId,
        releaseId
      )
      const releaseDto = await this.toReleaseDto(release, approvalState)
      await querryRunner.commitTransaction()
      return releaseDto
    } catch (e) {
      await querryRunner.rollbackTransaction()
      throw e
    } finally {
      await querryRunner.release()
    }
  }

  async getWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number
  ): Promise<ReleaseEntity> {
    return queryRunner.manager.findOneOrFail(ReleaseEntity, {
      where: { id: releaseId, namespace: { id: namespaceId } },
      relations: ['namespace', 'config'],
    })
  }

  async create(
    namespaceId: number,
    name: string,
    approvalMode: ApprovalMode,
    qgConfigId: number,
    plannedDate: Date,
    actor: RequestUser
  ): Promise<ReleaseDto> {
    const querryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await querryRunner.connect()
      await querryRunner.startTransaction('READ UNCOMMITTED')
      const release = await this.createWithTransaction(
        querryRunner,
        namespaceId,
        name,
        approvalMode,
        qgConfigId,
        plannedDate,
        actor
      )
      const approvalState = await this.getApprovalStateWithTransaction(
        querryRunner,
        namespaceId,
        release.id
      )
      const releaseDto = await this.toReleaseDto(release, approvalState)
      await querryRunner.commitTransaction()
      return releaseDto
    } catch (e) {
      await querryRunner.rollbackTransaction()
      throw e
    } finally {
      await querryRunner.release()
    }
  }

  async createWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    name: string,
    approvalMode: ApprovalMode,
    qgConfigId: number,
    plannedDate: Date,
    actor: RequestUser
  ): Promise<ReleaseEntity> {
    const config = await this.getConfig(queryRunner, namespaceId, qgConfigId)
    const nowDate = new Date()
    const newRelease = new ReleaseEntity()
    newRelease.namespace = { id: namespaceId } as Namespace
    newRelease.name = name
    newRelease.approvalMode = approvalMode
    newRelease.config = config
    newRelease.plannedDate = plannedDate
    newRelease.createdBy = actor.id
    newRelease.lastModifiedBy = actor.id
    newRelease.creationTime = nowDate
    newRelease.lastModificationTime = nowDate
    newRelease.closed = false
    newRelease.approvalState = ApprovalState.PENDING
    const release = await queryRunner.manager.save(newRelease)
    await this.auditService.append(
      namespaceId,
      release.id,
      {},
      release,
      AuditActor.convertFrom(actor),
      Action.CREATE,
      queryRunner.manager
    )
    return release
  }

  // TODO: Adjust as soon as we have a config module
  private async getConfig(
    queryRunner: QueryRunner,
    namespaceId: number,
    qgConfigId: number
  ): Promise<ConfigEntity> {
    const config = await queryRunner.manager.findOne(ConfigEntity, {
      where: { id: qgConfigId, namespace: { id: namespaceId } },
    })

    if (!config) {
      throw new NotFoundException(
        `Config not found, namespaceId: ${namespaceId}, qgConfigId: ${qgConfigId}`
      )
    }

    return config
  }

  async update(
    namespaceId: number,
    releaseId: number,
    actor: RequestUser,
    name?: string,
    approvalMode?: ApprovalMode,
    plannedDate?: Date
  ): Promise<ReleaseDto> {
    const querryRunner = this.repository.manager.connection.createQueryRunner()
    await querryRunner.connect()
    await querryRunner.startTransaction('READ COMMITTED')
    try {
      const release = await this.updateWithTransaction(
        querryRunner,
        namespaceId,
        releaseId,
        actor,
        name,
        approvalMode,
        plannedDate
      )
      const approvalState = await this.getApprovalStateWithTransaction(
        querryRunner,
        namespaceId,
        releaseId
      )
      const releaseDto = await this.toReleaseDto(release, approvalState)
      await querryRunner.commitTransaction()
      return releaseDto
    } catch (e) {
      await querryRunner.rollbackTransaction()
      throw e
    } finally {
      await querryRunner.release()
    }
  }

  async updateWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    actor: RequestUser,
    name?: string,
    approvalMode?: ApprovalMode,
    plannedDate?: Date
  ): Promise<ReleaseEntity> {
    const currentRelease = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId
    )

    checkForClosed(currentRelease)

    const originalRelease = currentRelease.DeepCopy()

    const nowDate = new Date()
    if (name) {
      currentRelease.name = name
    }
    if (approvalMode) {
      currentRelease.approvalMode = approvalMode

      if (approvalMode != originalRelease.approvalMode) {
        /*
         * The release's approval state may be impacted
         *
         * all -> one may move "pending" to "approved"
         * one -> all may move "approved" to "pending"
         *
         * Therefore, we recompute the approval state
         */
        const approvals = await queryRunner.manager.find(ApprovalEntity, {
          where: {
            release: { id: releaseId },
            namespace: { id: namespaceId },
          },
          relations: ['namespace', 'release'],
        })

        const approvalState = this.approvalService.computeAggregateApproval(
          approvalMode,
          approvals
        )

        currentRelease.approvalState = approvalState
      }
    }
    if (plannedDate) {
      currentRelease.plannedDate = plannedDate
    }
    currentRelease.lastModifiedBy = actor.id
    currentRelease.lastModificationTime = nowDate

    const release = await queryRunner.manager.save(currentRelease)
    // Populate id that was left out by the queryRunner
    release.config.id = currentRelease.config.id
    await this.auditService.append(
      namespaceId,
      release.id,
      originalRelease,
      release,
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager
    )
    return release
  }

  async remove(
    namespaceId: number,
    releaseId: number,
    actor: RequestUser
  ): Promise<void> {
    const querryRunner = this.repository.manager.connection.createQueryRunner()
    await querryRunner.connect()
    await querryRunner.startTransaction('READ COMMITTED')
    try {
      await this.removeWithTransaction(
        querryRunner,
        namespaceId,
        releaseId,
        actor
      )
      await querryRunner.commitTransaction()
    } catch (e) {
      await querryRunner.rollbackTransaction()
      throw e
    } finally {
      await querryRunner.release()
    }
  }

  async removeWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    actor: RequestUser
  ): Promise<void> {
    const original = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId
    )

    if (!original) {
      throw new Error('Unexpected state when retrieving release')
    }

    await this.approvalService.removeAllWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      actor
    )

    await this.overridesService.removeAllWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      actor
    )

    await this.commentsService.removeAllWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      actor
    )

    await this.taskService.removeAllWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      actor
    )

    await queryRunner.manager.delete(ReleaseEntity, {
      namespace: { id: namespaceId },
      id: releaseId,
    })

    await this.auditService.append(
      namespaceId,
      releaseId,
      original,
      {},
      AuditActor.convertFrom(actor),
      Action.DELETE,
      queryRunner.manager
    )
  }

  async getApprovalState(
    namespaceId: number,
    releaseId: number
  ): Promise<AggregateApprovalDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ COMMITTED')
    try {
      const release = await this.getWithTransaction(
        queryRunner,
        namespaceId,
        releaseId
      )

      const state = await this.approvalService.getApprovalStateWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        release.approvalMode
      )

      const dto = this.toAggregateApprovalDto(state)
      await queryRunner.commitTransaction()
      return dto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async getApprovalStateWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number
  ): Promise<ApprovalState> {
    const approvals = await queryRunner.manager.find(ApprovalEntity, {
      where: {
        release: { id: releaseId },
        namespace: { id: namespaceId },
      },
      relations: ['namespace', 'release'],
    })

    const release = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId
    )

    return this.approvalService.computeAggregateApproval(
      release.approvalMode,
      approvals
    )
  }

  async close(
    namespaceId: number,
    releaseId: number,
    actor: RequestUser
  ): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ COMMITTED')
    try {
      await this.closeWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        actor
      )
      return await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async closeWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    actor: RequestUser
  ): Promise<void> {
    const currentRelease = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId
    )

    if (!currentRelease) {
      throw new Error('Unexpected state when retrieving release')
    }

    if (currentRelease.closed) {
      return
    }

    const originalRelease = currentRelease.DeepCopy()

    const nowDate = new Date()
    currentRelease.lastModifiedBy = actor.id
    currentRelease.lastModificationTime = nowDate
    currentRelease.closed = true

    const release = await queryRunner.manager.save(currentRelease)
    // Populate id that was left out by the queryRunner
    release.config.id = currentRelease.config.id

    await this.auditService.append(
      namespaceId,
      releaseId,
      originalRelease,
      release,
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager
    )
  }

  isApproved(approvalMode: ApprovalMode, approvals: ApprovalEntity[]): boolean {
    switch (approvalMode) {
      case 'all':
        return approvals.every(
          (approval) => approval.approvalState == 'approved'
        )
      case 'one':
        return approvals.some(
          (approval) => approval.approvalState == 'approved'
        )
      default:
        throw new Error('Implementation bug')
    }
  }

  toAggregateApprovalDto(approvalState: ApprovalState): AggregateApprovalDto {
    const dto = new AggregateApprovalDto()
    dto.state = approvalState
    return dto
  }

  private async lastRunId(
    namespaceId: number,
    configId: number,
    lastModificationTime: Date,
    releaseClosed: boolean
  ): Promise<number | null> {
    let runs = []
    if (releaseClosed) {
      runs = await this.runRepository.find({
        where: {
          config: { id: configId },
          namespace: { id: namespaceId },
          completionTime: LessThan(lastModificationTime),
        },
        order: { completionTime: 'DESC' },
        take: 1,
      })
    } else {
      runs = await this.runRepository.find({
        where: { config: { id: configId }, namespace: { id: namespaceId } },
        order: { creationTime: 'DESC' },
        take: 1,
      })
    }
    if (!runs || runs.length == 0) {
      return null
    }
    return runs[0].id
  }

  async toReleaseDto(
    release: ReleaseEntity,
    approvalState: ApprovalState
  ): Promise<ReleaseDto> {
    const dto = new ReleaseDto()
    dto.id = release.id
    dto.name = release.name
    dto.approvalMode = release.approvalMode
    dto.approvalState = approvalState
    dto.createdBy = await this.usersService.getUser(release.createdBy)
    dto.creationTime = release.creationTime
    dto.lastModifiedBy = await this.usersService.getUser(release.lastModifiedBy)
    dto.lastModificationTime = release.lastModificationTime
    dto.plannedDate = release.plannedDate
    dto.qgConfigId = release.config.id
    dto.closed = release.closed
    dto.lastRunId = await this.lastRunId(
      release.namespace.id,
      release.config.id,
      release.lastModificationTime,
      release.closed
    )
    return dto
  }

  async toEntityList(
    releases: EntityList<ReleaseEntity>,
    approvals: EntityList<ApprovalEntity>
  ): Promise<EntityList<ReleaseDto>> {
    const releaseDtos = await Promise.all(
      releases.entities.map(async (release) => {
        const aggregateApprovalState =
          this.approvalService.computeAggregateApproval(
            release.approvalMode,
            approvals.entities.filter(
              (approval) => approval.release.id === release.id
            )
          )
        return await this.toReleaseDto(release, aggregateApprovalState)
      })
    )
    return {
      entities: releaseDtos,
      itemCount: releases.itemCount,
    }
  }
}
