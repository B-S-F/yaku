import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { ServiceType } from '../utils/enums/serviceType.enum'
import { Core } from '../utils/interfaces/core.interface'
import { Finding } from '../utils/interfaces/finding.interface'

@Entity({ name: 'metric' })
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'enum', enum: ServiceType })
  service: ServiceType

  @Column({ type: 'jsonb' })
  metric: Core | Finding

  @CreateDateColumn({ type: 'timestamptz' })
  creationTime: Date
}
