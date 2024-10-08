import { Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { RequestUser } from '../module.utils'
import { Namespace } from '../namespace/namespace.entity'

/*
 * Be careful when changing this type,
 * as the layout of the JSON in the DB may change
 */
export class AuditActor {
  /*
   * Sentinel to prevent that other isomorphic objects are accepted instead of AuditActor
   * Leave value undfined, so that it does not show up in every object
   */
  private readonly __type_sentinel: AuditActor

  private constructor(
    readonly id: string,
    readonly username: string,
    readonly email: string,
    readonly displayName: string
  ) {}

  static convertFrom(user: RequestUser): AuditActor {
    if (!user) {
      throw new Error('user is falsy')
    }

    if (!user.id) {
      throw new Error('id of user is falsy')
    }

    const uuidRegEx =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/

    if (!uuidRegEx.test(user.id)) {
      throw new Error('Illegal id, expected id to be a lowercase uuid')
    }

    if (!user.username) {
      throw new Error('username of user is falsy')
    }

    if (!user.email) {
      throw new Error('email of user is falsy')
    }

    if (!user.displayName) {
      throw new Error('displayName of user is falsy')
    }

    return new AuditActor(user.id, user.username, user.email, user.displayName)
  }
}

export enum Action {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}
export const actions = [Action.CREATE, Action.UPDATE, Action.DELETE] as const

export class AuditEntity {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Namespace)
  namespace: Namespace

  @Column({ nullable: false })
  entityId: number

  @Column('jsonb', { nullable: false })
  original: object

  @Column('jsonb', { nullable: false })
  modified: object

  @Column('jsonb', { nullable: false })
  actor: AuditActor

  @Column({ type: 'timestamptz', nullable: false })
  modificationTime: Date

  @Column({ type: 'enum', enum: actions, nullable: false })
  action: Action
}
