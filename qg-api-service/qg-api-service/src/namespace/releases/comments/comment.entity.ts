import { Injectable } from '@nestjs/common'
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { AuditEntity } from '../../audit/audit.entity'
import { AuditService } from '../../audit/audit.service'
import { Namespace } from '../../namespace/namespace.entity'
import { ReleaseEntity } from '../release.entity'
import { ReferenceType, referenceTypes } from './comments.utils'

export enum CommentStatus {
  CREATED = 'created',
  RESOLVED = 'resolved',
}
const commentStatuses = [CommentStatus.CREATED, CommentStatus.RESOLVED] as const

export class CheckReference {
  chapter: string
  requirement: string
  check: string
}

export type RootCommentEntity = CommentEntity & { replies?: CommentEntity[] }

@Entity('comment')
@Index(['id'], { unique: true })
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number
  @ManyToOne(() => Namespace, { nullable: false })
  namespace: Namespace
  @ManyToOne(() => ReleaseEntity, { nullable: false })
  release: ReleaseEntity
  @Column('enum', { enum: referenceTypes })
  referenceType: ReferenceType
  @Column({ nullable: false })
  content: string
  @Column({ nullable: false })
  todo: boolean
  @Column({ type: 'enum', enum: commentStatuses, nullable: false })
  status: CommentStatus
  @Column({ nullable: false })
  createdBy: string
  @Column({ nullable: false })
  lastModifiedBy: string
  @Column({ type: 'timestamptz', nullable: false })
  creationTime: Date
  @Column({ type: 'timestamptz', nullable: false })
  lastModificationTime: Date
  @Column('jsonb', { nullable: true })
  reference: CheckReference
  @ManyToOne((type) => CommentEntity, (comment) => comment.children, {
    nullable: true,
  })
  parent: CommentEntity
  @OneToMany((type) => CommentEntity, (comment) => comment.parent, {
    nullable: true,
  })
  children: CommentEntity[]

  DeepCopy(): CommentEntity {
    const comment = new CommentEntity()
    const deepCopy = JSON.parse(JSON.stringify(this))
    comment.id = deepCopy.id
    comment.referenceType = deepCopy.referenceType
    comment.namespace = deepCopy.namespace
    comment.release = deepCopy.release
    comment.content = deepCopy.content
    comment.todo = deepCopy.todo
    comment.status = deepCopy.status
    comment.createdBy = deepCopy.createdBy
    comment.lastModifiedBy = deepCopy.lastModifiedBy
    comment.creationTime = new Date(deepCopy.creationTime)
    comment.lastModificationTime = new Date(deepCopy.lastModificationTime)
    comment.reference = deepCopy.reference
    comment.parent = deepCopy.parent
    comment.children = deepCopy.children
    return comment
  }
}

@Entity('comment_audit')
export class CommentAuditEntity extends AuditEntity {}

@Injectable()
export class CommentAuditService extends AuditService<CommentAuditEntity> {
  constructor() {
    super(CommentAuditEntity)
  }
}
