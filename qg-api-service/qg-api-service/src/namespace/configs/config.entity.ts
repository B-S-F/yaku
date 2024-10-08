import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Namespace } from '../namespace/namespace.entity'

const QG_CONFIG_FILENAME = 'qg-config.yaml'
const QG_CONFIG_ALTERNATIVE_FILENAME_PATTERN = /qg-config-\d+.yaml/

@Entity()
@Index(['namespace', 'id'], { unique: true })
export class ConfigEntity {
  @PrimaryGeneratedColumn()
  globalId: number

  @ManyToOne(() => Namespace)
  namespace: Namespace

  @Column('integer')
  id: number

  @Column()
  name: string

  @Column({ nullable: true })
  description?: string

  @Column({ type: 'timestamptz' })
  creationTime: Date

  @Column({ type: 'timestamptz' })
  lastModificationTime: Date

  @OneToMany(() => FileEntity, (file) => file.config)
  files: FileEntity[]

  qgConfig(): FileEntity {
    return this.files.find((file) => file.filename === QG_CONFIG_FILENAME)
  }

  additionalConfigs(includeAlternativeQgConfigs = true): FileEntity[] {
    return this.files.filter(
      (file) =>
        file.filename !== QG_CONFIG_FILENAME &&
        (includeAlternativeQgConfigs ||
          !file.filename.match(QG_CONFIG_ALTERNATIVE_FILENAME_PATTERN))
    )
  }
}

@Entity()
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  filename: string

  @ManyToOne(() => ConfigEntity, (config) => config.files, {
    onDelete: 'CASCADE',
  })
  config: ConfigEntity
}

@Entity()
export class FileContentEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  content: string

  @OneToOne(() => FileEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  file: FileEntity
}
