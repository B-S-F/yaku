import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Namespace {
  @PrimaryGeneratedColumn()
  id: number

  @Index()
  @Column()
  name: string
}
