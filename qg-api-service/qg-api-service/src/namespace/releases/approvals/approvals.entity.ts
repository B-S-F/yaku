import { Injectable } from '@nestjs/common'
import {
  Column,
  CreateDateColumn,
  Entity,
  EntityManager,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'
import { AuditEntity } from '../../audit/audit.entity'
import { AuditService } from '../../audit/audit.service'
import { Namespace } from '../../namespace/namespace.entity'
import { CommentEntity } from '../comments/comment.entity'
import { ReleaseEntity } from '../release.entity'
import {
  ApprovalState,
  approvalStates,
  APPROVER_UNIQUE_PER_RELEASE_CONSTRAINT,
} from './approvals.util'

@Entity('approval')
@Index(['id'], { unique: true })
@Unique(APPROVER_UNIQUE_PER_RELEASE_CONSTRAINT, [
  'namespace',
  'release',
  'approver',
])
export class ApprovalEntity {
  @PrimaryGeneratedColumn()
  id: number
  @ManyToOne(() => Namespace)
  namespace: Namespace
  @ManyToOne(() => ReleaseEntity)
  release: ReleaseEntity
  @Column({ nullable: false })
  approver: string
  @Column({ type: 'enum', enum: approvalStates, nullable: false })
  approvalState: ApprovalState
  @Column({ nullable: false })
  createdBy: string
  @Column({ nullable: false })
  lastModifiedBy: string
  @CreateDateColumn({ type: 'timestamptz', nullable: false })
  creationTime: Date
  @UpdateDateColumn({ type: 'timestamptz', nullable: false })
  lastModificationTime: Date
  @OneToOne(() => CommentEntity)
  @JoinColumn()
  comment: CommentEntity

  DeepCopy(): ApprovalEntity {
    const approval = new ApprovalEntity()
    const deepCopy = JSON.parse(JSON.stringify(this))
    approval.id = deepCopy.id
    approval.namespace = deepCopy.namespace
    approval.release = deepCopy.release
    approval.approver = deepCopy.approver
    approval.approvalState = deepCopy.approvalState
    approval.createdBy = deepCopy.createdBy
    approval.lastModifiedBy = deepCopy.lastModifiedBy
    approval.creationTime = new Date(deepCopy.creationTime)
    approval.lastModificationTime = new Date(deepCopy.lastModificationTime)
    approval.comment = deepCopy.comment
    return approval
  }
}

@Entity('approval_audit')
export class ApprovalAuditEntity extends AuditEntity {}

@Injectable()
export class ApprovalAuditService extends AuditService<ApprovalAuditEntity> {
  constructor() {
    super(ApprovalAuditEntity)
  }

  async list(
    namespaceId: number,
    releaseId: number,
    timestamp: Date,
    amount: number,
    direction: 'before' | 'after',
    entityManager: EntityManager
  ): Promise<ApprovalAuditEntity[]> {
    const queryBuilder = entityManager.createQueryBuilder(
      ApprovalAuditEntity,
      'approval_audit'
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
