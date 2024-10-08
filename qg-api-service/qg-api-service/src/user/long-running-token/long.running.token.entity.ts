import { Injectable } from '@nestjs/common'
import { AuditService } from './audit/audit.service'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { AuditEntity } from './audit/audit.entity'

export enum STATUS {
  ACTIVE = 'active',
  REVOKED = 'revoked',
}

export const statuses = [STATUS.ACTIVE, STATUS.REVOKED] as STATUS[]

@Entity('long_running_token')
export class LongRunningTokenEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  description: string

  @Column()
  kcuid: string

  @Column()
  try_admin: boolean

  @Column()
  hash: string

  @Column({ type: 'enum', enum: statuses })
  status: STATUS

  @Column()
  createdBy: string

  @Column()
  lastModifiedBy: string

  @Column({ type: 'timestamptz' })
  creationTime: Date

  @Column({ type: 'timestamptz' })
  lastModificationTime: Date

  @Column({ type: 'timestamptz', default: '1970-01-01 00:00:00+00' })
  lastUsed: Date

  DeepCopy(): LongRunningTokenEntity {
    const entity = new LongRunningTokenEntity()
    const deepCopy = JSON.parse(JSON.stringify(this))

    entity.id = deepCopy.id
    entity.description = deepCopy.description
    entity.kcuid = deepCopy.kcuid
    entity.try_admin = deepCopy.admin
    entity.hash = deepCopy.hash
    entity.status = deepCopy.status
    entity.createdBy = deepCopy.createdBy
    entity.lastModifiedBy = deepCopy.lastModifiedBy
    entity.creationTime = new Date(deepCopy.creationTime)
    entity.lastModificationTime = new Date(deepCopy.lastModificationTime)
    entity.lastUsed = new Date(deepCopy.lastUsed)

    return entity
  }
}

@Entity('long_running_token_audit')
export class LongRunningTokenAuditEntity extends AuditEntity {}

@Injectable()
export class LongRunningTokenAuditService extends AuditService<LongRunningTokenAuditEntity> {
  constructor() {
    super(LongRunningTokenAuditEntity)
  }
}
