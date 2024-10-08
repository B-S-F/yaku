import { Injectable } from '@nestjs/common'
import {
  Column,
  Entity,
  EntityManager,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { AuditEntity } from '../audit/audit.entity'
import { AuditService } from '../audit/audit.service'
import { ConfigEntity } from '../configs/config.entity'
import { Namespace } from '../namespace/namespace.entity'

export enum RunStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export enum RunResult {
  Green = 'GREEN',
  Yellow = 'YELLOW',
  Red = 'RED',
  Pending = 'PENDING',
  Failed = 'FAILED',
}

@Entity()
@Index(['namespace', 'id'], { unique: true })
export class Run {
  @PrimaryGeneratedColumn()
  globalId: number

  @ManyToOne(() => Namespace)
  namespace: Namespace

  @Column('integer')
  id: number

  @Column({ default: RunStatus.Pending })
  status: RunStatus = RunStatus.Pending

  @Column({ nullable: true })
  overallResult?: RunResult

  @Column({ nullable: true })
  argoNamespace?: string

  @Column({ nullable: true })
  argoName?: string

  @Column({ nullable: true })
  argoId?: string

  @Column({ nullable: true, type: 'simple-json' })
  log?: string[]

  @Column({ type: 'timestamptz', nullable: true })
  creationTime?: Date

  @Column({ update: false })
  storagePath: string

  @Column({ type: 'timestamptz', nullable: true })
  completionTime?: Date

  @ManyToOne(() => ConfigEntity)
  config: ConfigEntity

  DeepCopy(): Run {
    const copy = new Run()
    copy.globalId = this.globalId
    copy.namespace = this.namespace
    copy.id = this.id
    copy.status = this.status
    copy.overallResult = this.overallResult
    copy.argoNamespace = this.argoNamespace
    copy.argoName = this.argoName
    copy.argoId = this.argoId
    copy.log = this.log
    copy.creationTime = this.creationTime
    copy.storagePath = this.storagePath
    copy.completionTime = this.completionTime
    copy.config = this.config
    return copy
  }
}

@Entity('run_audit')
export class RunAuditEntity extends AuditEntity {}

@Injectable()
export class RunAuditService extends AuditService<RunAuditEntity> {
  constructor() {
    super(RunAuditEntity)
  }

  async list(
    namespaceId: number,
    configId: number,
    timestamp: Date | undefined,
    amount: number,
    direction: 'before' | 'after',
    entityManager: EntityManager
  ): Promise<RunAuditEntity[]> {
    const query = entityManager
      .createQueryBuilder(RunAuditEntity, 'run_audit')
      .where('run_audit.namespaceId = :namespaceId', { namespaceId })
      .andWhere(
        `((run_audit.original->'config'->'id')::numeric = :id OR (run_audit.modified->'config'->'id')::numeric = :id)`,
        { id: configId }
      )
      .andWhere(
        'run_audit.modificationTime ' +
          (direction === 'before' ? '<' : '>') +
          ' :timestamp',
        { timestamp }
      )
      .orderBy(
        'run_audit.modificationTime',
        direction === 'before' ? 'DESC' : 'ASC'
      )
      .limit(amount)
    return await query.getMany()
  }
}
