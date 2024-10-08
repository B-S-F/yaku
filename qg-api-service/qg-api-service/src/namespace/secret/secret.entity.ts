import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Namespace } from '../namespace/namespace.entity'

@Entity()
@Index(['namespace', 'name'], { unique: true })
export class Secret {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Namespace)
  @Index()
  namespace: Namespace

  @Column()
  name: string

  @Column({ nullable: true })
  description?: string

  @Column({ type: 'timestamptz' })
  creationTime: Date

  @Column({ type: 'timestamptz' })
  lastModificationTime: Date
}
