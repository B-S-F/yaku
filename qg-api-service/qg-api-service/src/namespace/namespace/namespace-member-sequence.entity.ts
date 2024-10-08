import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Namespace } from './namespace.entity'

@Entity()
@Index(['namespace', 'entityName'], { unique: true })
export class NamespaceMemberSequence {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Namespace)
  namespace: Namespace

  @Column()
  entityName: string

  @Column('integer', { default: 0 })
  lastId: number
}
