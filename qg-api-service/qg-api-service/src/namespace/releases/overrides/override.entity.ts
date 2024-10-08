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
import { AuditEntity } from '../../audit/audit.entity'
import { AuditService } from '../../audit/audit.service'
import { Namespace } from '../../namespace/namespace.entity'
import { ReleaseEntity } from '../release.entity'
import {
  CheckColor,
  OVERRIDE_UNIQUE_PER_RELEASE_CONSTRAINT,
  checkColors,
} from './overrides.utils'

@Entity('override')
@Index(['id'], { unique: true })
@Unique(OVERRIDE_UNIQUE_PER_RELEASE_CONSTRAINT, [
  'namespace',
  'release',
  'chapter',
  'requirement',
  'check',
])
export class OverrideEntity {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Namespace)
  namespace: Namespace

  @ManyToOne(() => ReleaseEntity)
  release: ReleaseEntity

  @Column({ type: 'enum', enum: checkColors, nullable: false })
  manualColor: CheckColor

  @Column({ type: 'enum', enum: checkColors, nullable: false })
  originalColor: CheckColor

  @Column()
  chapter: string

  @Column()
  requirement: string

  @Column()
  check: string

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

  DeepCopy(): OverrideEntity {
    const newEntity = new OverrideEntity()
    const deepCopy = JSON.parse(JSON.stringify(this))
    newEntity.id = deepCopy.id
    newEntity.namespace = deepCopy.namespace
    newEntity.release = deepCopy.release
    newEntity.manualColor = deepCopy.manualColor
    newEntity.originalColor = deepCopy.originalColor
    newEntity.chapter = deepCopy.chapter
    newEntity.requirement = deepCopy.requirement
    newEntity.check = deepCopy.check
    newEntity.createdBy = deepCopy.createdBy
    newEntity.lastModifiedBy = deepCopy.lastModifiedBy
    newEntity.creationTime = new Date(deepCopy.creationTime)
    newEntity.lastModificationTime = new Date(deepCopy.lastModificationTime)
    newEntity.comment = deepCopy.comment
    return newEntity
  }

  DeepCopyWithoutRelations(): OverrideEntity {
    const newEntity = this.DeepCopy()

    const nsId = newEntity.namespace.id
    newEntity.namespace = { id: nsId } as Namespace

    const releaseId = newEntity.release.id
    newEntity.release = { id: releaseId } as ReleaseEntity

    return newEntity
  }
}

@Entity('override_audit')
export class OverrideAuditEntity extends AuditEntity {}

@Injectable()
export class OverrideAuditService extends AuditService<OverrideAuditEntity> {
  constructor() {
    super(OverrideAuditEntity)
  }

  async list(
    namespaceId: number,
    releaseId: number,
    timestamp: Date,
    amount: number,
    direction: 'before' | 'after',
    entityManager: EntityManager
  ): Promise<OverrideAuditEntity[]> {
    const queryBuilder = entityManager.createQueryBuilder(
      OverrideAuditEntity,
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
