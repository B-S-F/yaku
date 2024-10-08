import { ReleaseEntity } from '../../releases/release.entity'
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'

@Entity({ name: 'subscriptions' })
export class SubscriptionEntity {
  @PrimaryColumn({ type: 'varchar' })
  userId: string

  @PrimaryColumn({ type: 'integer' })
  releaseId: number

  @ManyToOne(() => ReleaseEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'releaseId', referencedColumnName: 'id' }])
  release: ReleaseEntity

  @CreateDateColumn({ type: 'timestamptz', nullable: false })
  creationTime: Date
}
