import { Injectable } from '@nestjs/common'
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { AuditEntity } from '../../../namespace/audit/audit.entity'
import { AuditService } from '../../../namespace/audit/audit.service'
import { Namespace } from '../../../namespace/namespace/namespace.entity'
import { ReleaseEntity } from '../release.entity'

export enum ReminderMode {
  DISABLED = 'disabled',
  OVERDUE = 'overdue',
  ALWAYS = 'always',
}
export const reminderModes = [
  ReminderMode.DISABLED,
  ReminderMode.OVERDUE,
  ReminderMode.ALWAYS,
] as const
@Entity('task')
@Index(['id'], { unique: true })
export class TaskEntity {
  @PrimaryGeneratedColumn()
  id: number
  @ManyToOne(() => Namespace)
  namespace: Namespace
  @ManyToOne(() => ReleaseEntity)
  release: ReleaseEntity
  @Column({ nullable: true })
  chapter?: string
  @Column({ nullable: true })
  requirement?: string
  @Column({ nullable: true })
  check?: string
  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date
  @Column('enum', {
    nullable: false,
    enum: reminderModes,
    default: ReminderMode.DISABLED,
  })
  reminder: ReminderMode
  @Column({ nullable: false, default: '' })
  title: string
  @Column({ nullable: true })
  description: string
  @Column({ nullable: false })
  createdBy: string
  @Column({ nullable: false })
  lastModifiedBy: string
  @Column({ type: 'timestamptz', nullable: false })
  creationTime: Date
  @Column({ type: 'timestamptz', nullable: false })
  lastModificationTime: Date
  @Column({ nullable: false, default: false })
  closed: boolean
  @Column('text', { nullable: true, array: true })
  assignees: string[]

  DeepCopy(): TaskEntity {
    const task = new TaskEntity()
    const deepCopy = JSON.parse(JSON.stringify(this))
    task.id = deepCopy.id
    task.namespace = deepCopy.namespace
    task.release = deepCopy.release
    task.chapter = deepCopy.chapter
    task.requirement = deepCopy.requirement
    task.check = deepCopy.check
    task.dueDate = new Date(deepCopy.dueDate)
    task.reminder = deepCopy.reminder
    task.title = deepCopy.title
    task.description = deepCopy.description
    task.createdBy = deepCopy.createdBy
    task.lastModifiedBy = deepCopy.lastModifiedBy
    task.creationTime = new Date(deepCopy.creationTime)
    task.lastModificationTime = new Date(deepCopy.lastModificationTime)
    task.closed = deepCopy.closed
    task.assignees = deepCopy.assignees
    return task
  }

  DeepCopyWithoutRelations(): TaskEntity {
    const newEntity = this.DeepCopy()

    const nsId = newEntity.namespace.id
    newEntity.namespace = { id: nsId } as Namespace

    const releaseId = newEntity.release.id
    newEntity.release = { id: releaseId } as ReleaseEntity

    return newEntity
  }
}

@Entity('task_audit')
export class TaskAuditEntity extends AuditEntity {}

@Injectable()
export class TaskAuditService extends AuditService<TaskAuditEntity> {
  constructor() {
    super(TaskAuditEntity)
  }
}

@Entity('task_notification')
@Index(['id'], { unique: true })
export class TaskNotificationEntity {
  @PrimaryGeneratedColumn()
  id: number
  @ManyToOne(() => TaskEntity)
  task: TaskEntity
  @Column({ type: 'timestamptz', nullable: false })
  lastNotified: Date
}
