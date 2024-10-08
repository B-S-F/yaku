import { RunOverallStatusType } from '../utils/enums/runOverallStatusType.enum'
import { StatusType } from '../utils/enums/statusType.enum'
import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm'
import { Metadata } from '../utils/interfaces/findingsInterfaces'
import { RunStatus } from '../../run/run.entity'

@Entity({ name: 'findings' })
export class Finding {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100, unique: true })
  uniqueIdHash: string

  @Column({ type: 'jsonb' })
  metadata: Metadata

  @Column({ type: 'integer' })
  namespaceId: number

  @Column({ type: 'integer' })
  configId: number

  @Column({ type: 'integer' })
  runId: number

  @Column({ type: 'enum', enum: RunStatus })
  runStatus: RunStatus

  @Column({
    type: 'enum',
    enum: RunOverallStatusType,
  })
  runOverallResult: RunOverallStatusType

  @Column({ type: 'timestamptz' })
  runCompletionTime: string

  @Column({ type: 'varchar', length: 300 })
  chapter: string

  @Column({ type: 'varchar', length: 300 })
  requirement: string

  @Column({ type: 'varchar', length: 300 })
  check: string

  @Column({ type: 'varchar', length: 300 })
  criterion: string

  @Column({ type: 'varchar', length: 3000 })
  justification: string

  @Column({ type: 'integer', default: 1 })
  occurrenceCount: number

  @Column({ type: 'enum', enum: StatusType })
  status: StatusType

  @Column({ type: 'text', nullable: true })
  resolvedComment?: string

  @Column({ type: 'timestamptz', nullable: true })
  resolvedDate?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  resolver: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date
}
