import { Injectable } from '@nestjs/common'
import {
  Column,
  Entity,
  EntityManager,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { AuditEntity } from '../../../../namespace/audit/audit.entity'
import { AuditService } from '../../../../namespace/audit/audit.service'
import { Namespace } from '../../../../namespace/namespace/namespace.entity'
import { ReleaseEntity } from '../../release.entity'
import { RESULT_OVERRIDE_UNIQUE_PER_RELEASE_CONTRAINT } from './check-result-override.utils'

@Entity('check_result_override')
@Index(['id'], { unique: true })
@Unique(RESULT_OVERRIDE_UNIQUE_PER_RELEASE_CONTRAINT, [
  'namespace',
  'release',
  'chapter',
  'requirement',
  'check',
  'hash',
])
export class CheckResultOverrideEntity {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Namespace)
  namespace: Namespace

  @ManyToOne(() => ReleaseEntity)
  release: ReleaseEntity

  @Column()
  manualFulfilled: boolean

  @Column()
  originalFulfilled: boolean

  @Column()
  chapter: string

  @Column()
  requirement: string

  @Column()
  check: string

  @Column()
  hash: string

  @Column()
  createdBy: string

  @Column()
  lastModifiedBy: string

  @Column({ type: 'timestamptz' })
  creationTime: Date

  @Column({ type: 'timestamptz' })
  lastModificationTime: Date

  @Column({ nullable: false })
  comment: string

  DeepCopy(): CheckResultOverrideEntity {
    const newEntity = new CheckResultOverrideEntity()
    const deepCopy = JSON.parse(JSON.stringify(this))
    newEntity.id = deepCopy.id
    newEntity.namespace = deepCopy.namespace
    newEntity.release = deepCopy.release
    newEntity.manualFulfilled = deepCopy.manualFulfilled
    newEntity.originalFulfilled = deepCopy.originalFulfilled
    newEntity.chapter = deepCopy.chapter
    newEntity.requirement = deepCopy.requirement
    newEntity.check = deepCopy.check
    newEntity.hash = deepCopy.hash
    newEntity.createdBy = deepCopy.createdBy
    newEntity.lastModifiedBy = deepCopy.lastModifiedBy
    newEntity.creationTime = new Date(deepCopy.creationTime)
    newEntity.lastModificationTime = new Date(deepCopy.lastModificationTime)
    newEntity.comment = deepCopy.comment
    return newEntity
  }

  DeepCopyWithoutRelations(): CheckResultOverrideEntity {
    const newEntity = this.DeepCopy()

    const nsId = newEntity.namespace.id
    newEntity.namespace = { id: nsId } as Namespace

    const releaseId = newEntity.release.id
    newEntity.release = { id: releaseId } as ReleaseEntity

    return newEntity
  }
}

@Entity('check_result_override_audit')
export class CheckResultOverrideAuditEntity extends AuditEntity {}

@Injectable()
export class CheckResultOverrideAuditService extends AuditService<CheckResultOverrideAuditEntity> {
  constructor() {
    super(CheckResultOverrideAuditEntity)
  }

  async list(
    namespaceId: number,
    releaseId: number,
    timestamp: Date,
    amount: number,
    direction: 'before' | 'after',
    entityManager: EntityManager
  ): Promise<CheckResultOverrideAuditEntity[]> {
    const queryBuilder = entityManager.createQueryBuilder(
      CheckResultOverrideAuditEntity,
      'override_audit'
    )
    queryBuilder.where('"namespaceId" = :namespaceId', { namespaceId })
    queryBuilder.andWhere(
      `(original->'release'->'id' = :releaseId OR modified->'release'->'id' = :releaseId)`,
      { releaseId }
    )
    queryBuilder.andWhere(
      `"modificationTime" ${direction === 'before' ? '<' : '>'} :timestamp`,
      { timestamp }
    )
    queryBuilder.orderBy(
      '"modificationTime"',
      direction === 'before' ? 'DESC' : 'ASC'
    )
    queryBuilder.limit(amount)
    return await queryBuilder.getMany()
  }
}
