import { Injectable } from '@nestjs/common'
import {
  Column,
  CreateDateColumn,
  Entity,
  EntityManager,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { AuditEntity } from '../audit/audit.entity'
import { AuditService } from '../audit/audit.service'
import { ConfigEntity } from '../configs/config.entity'
import { Namespace } from '../namespace/namespace.entity'
import { ApprovalState, approvalStates } from './approvals/approvals.util'

export const approvalModes = ['one', 'all'] as const
export type ApprovalMode = (typeof approvalModes)[number]

@Entity('release')
@Index(['id'], { unique: true })
export class ReleaseEntity {
  @PrimaryGeneratedColumn()
  id: number
  @ManyToOne(() => Namespace)
  namespace: Namespace
  @Column({ nullable: false })
  name: string
  @Column({ type: 'enum', enum: approvalModes, nullable: false })
  approvalMode: ApprovalMode
  @ManyToOne(() => ConfigEntity, { nullable: false })
  config: ConfigEntity
  @Column({ nullable: false })
  createdBy: string
  @Column({ nullable: false })
  lastModifiedBy: string
  @Column({ type: 'timestamptz', nullable: false })
  plannedDate: Date
  @CreateDateColumn({ type: 'timestamptz', nullable: false })
  creationTime: Date
  @UpdateDateColumn({ type: 'timestamptz', nullable: false })
  lastModificationTime: Date
  @Column({ nullable: false, default: false })
  closed: boolean
  @Column({ type: 'enum', enum: approvalStates, nullable: true, default: null })
  approvalState: ApprovalState

  DeepCopy(): ReleaseEntity {
    const release = new ReleaseEntity()
    const deepCopy = JSON.parse(JSON.stringify(this))
    release.id = deepCopy.id
    release.namespace = deepCopy.namespace
    release.name = deepCopy.name
    release.approvalMode = deepCopy.approvalMode
    release.config = deepCopy.config
    release.createdBy = deepCopy.createdBy
    release.lastModifiedBy = deepCopy.lastModifiedBy
    release.plannedDate = new Date(deepCopy.plannedDate)
    release.creationTime = new Date(deepCopy.creationTime)
    release.lastModificationTime = new Date(deepCopy.lastModificationTime)
    release.closed = deepCopy.closed
    release.approvalState = deepCopy.approvalState
    return release
  }
}

@Entity('release_audit')
export class ReleaseAuditEntity extends AuditEntity {}

@Injectable()
export class ReleaseAuditService extends AuditService<ReleaseAuditEntity> {
  constructor() {
    super(ReleaseAuditEntity)
  }

  async list(
    namespaceId: number,
    releaseId: number,
    timestamp: Date | undefined,
    amount: number,
    direction: 'before' | 'after',
    entityManager: EntityManager
  ): Promise<ReleaseAuditEntity[]> {
    const query = entityManager
      .createQueryBuilder(ReleaseAuditEntity, 'release_audit')
      .where('release_audit.namespaceId = :namespaceId', { namespaceId })
      .andWhere(
        `((release_audit.original->'id')::numeric = :id OR (release_audit.modified->'id')::numeric = :id)`,
        { id: releaseId }
      )
      .andWhere(
        'release_audit.modificationTime ' +
          (direction === 'before' ? '<' : '>') +
          ' :timestamp',
        { timestamp }
      )
      .orderBy(
        'release_audit.modificationTime',
        direction === 'before' ? 'DESC' : 'ASC'
      )
      .limit(amount)
    return await query.getMany()
  }
}
