import { RequestUser } from '../module.utils'
import { AuditActor } from './audit.entity'

describe('Audit Entity', () => {
  it('happy case init with user', () => {
    const user = new RequestUser(
      '7341a294-7a51-4fdc-90c6-af58e6bea690',
      'username',
      'email',
      'displayName'
    )
    const actor = AuditActor.convertFrom(user)
    expect(actor.id).toBe('7341a294-7a51-4fdc-90c6-af58e6bea690')
    expect(actor.username).toBe('username')
    expect(actor.email).toBe('email')
    expect(actor.displayName).toBe('displayName')
  })

  it('validate serialization', () => {
    /*
     * This is a very important test, as we rely on proper serialization of the
     * AuditActor object as we write it into the database
     */
    const user = new RequestUser(
      '7341a294-7a51-4fdc-90c6-af58e6bea690',
      'username',
      'email',
      'displayName'
    )
    const actor = AuditActor.convertFrom(user)
    expect(actor.id).toBe('7341a294-7a51-4fdc-90c6-af58e6bea690')
    expect(actor.username).toBe('username')
    expect(actor.email).toBe('email')
    expect(actor.displayName).toBe('displayName')
    expect(JSON.stringify(actor)).toBe(
      '{"id":"7341a294-7a51-4fdc-90c6-af58e6bea690","username":"username","email":"email","displayName":"displayName"}'
    )
  })

  it('fails with empty string as id', () => {
    const user = new RequestUser('', 'username', 'email', 'displayName')
    expect(() => AuditActor.convertFrom(user)).toThrow('id')
  })

  it('fails with empty string as username', () => {
    const user = new RequestUser(
      '7341a294-7a51-4fdc-90c6-af58e6bea690',
      '',
      'email',
      'displayName'
    )
    expect(() => AuditActor.convertFrom(user)).toThrow('username')
  })

  it('fails with empty string as email', () => {
    const user = new RequestUser(
      '7341a294-7a51-4fdc-90c6-af58e6bea690',
      'username',
      '',
      'displayName'
    )
    expect(() => AuditActor.convertFrom(user)).toThrow('email')
  })

  it('fails with empty string as displayName', () => {
    const user = new RequestUser(
      '7341a294-7a51-4fdc-90c6-af58e6bea690',
      'username',
      'email',
      ''
    )
    expect(() => AuditActor.convertFrom(user)).toThrow('displayName')
  })

  it('fails with non-uuid id string', () => {
    const user = new RequestUser('INVALID', 'username', 'email', 'displayName')
    expect(() => AuditActor.convertFrom(user)).toThrow('uuid')
  })

  it('accepts nil uuid', () => {
    const user = new RequestUser(
      '00000000-0000-0000-0000-000000000000',
      'username',
      'email',
      'displayName'
    )
    const actor = AuditActor.convertFrom(user)
    expect(actor.id).toBe('00000000-0000-0000-0000-000000000000')
    expect(actor.username).toBe('username')
    expect(actor.email).toBe('email')
    expect(actor.displayName).toBe('displayName')
  })
})
