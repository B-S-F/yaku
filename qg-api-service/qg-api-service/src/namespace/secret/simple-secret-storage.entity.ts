import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm'

@Entity()
@Unique(['namespaceId', 'name'])
export class EncryptedSecret {
  @Index()
  @PrimaryColumn()
  namespaceId: number

  @PrimaryColumn()
  name: string

  @Column()
  value: string
}
