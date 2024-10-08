import { AuditActor } from '../../../namespace/audit/audit.entity'
import { Column, PrimaryGeneratedColumn } from 'typeorm'

export enum Action {
  CREATE = 'create',
  UPDATE = 'update',
}
export const actions = [Action.CREATE, Action.UPDATE] as const

export class AuditEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  entityId: number

  @Column('jsonb')
  original: object

  @Column('jsonb')
  modified: object

  @Column('jsonb', { nullable: false })
  actor: AuditActor

  @Column({ type: 'timestamptz' })
  modificationTime: Date

  @Column({ type: 'enum', enum: actions })
  action: Action
}
