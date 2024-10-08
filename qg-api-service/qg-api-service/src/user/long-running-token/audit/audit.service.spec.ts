import { AuditActor } from '../../../namespace/audit/audit.entity'
import { RequestUser } from '../../../namespace/module.utils'
import { Action, AuditEntity } from './audit.entity'
import { AuditService } from './audit.service'

describe('Audit Service', () => {
  const service = new AuditService<AuditEntity>(AuditEntity)

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it.each(['create', 'update'])(
    'should add audit for %s action',
    async (action: Action) => {
      const entityManager = {
        insert: jest.fn(),
      } as any
      const entityId = 1
      const original = { a: 'a' }
      const modified = { b: 'b' }
      const actor = new RequestUser(
        '7341a294-7a51-4fdc-90c6-af58e6bea690',
        'actor',
        'actor',
        'actor'
      )

      await service.append(
        entityId,
        original,
        modified,
        AuditActor.convertFrom(actor),
        action,
        entityManager
      )

      expect(entityManager.insert).toBeCalledWith(
        AuditEntity,
        expect.objectContaining({
          entityId,
          original,
          modified,
          actor,
          modificationTime: expect.any(Date),
          action,
        })
      )

      expect(entityManager.insert).toBeCalledTimes(1)
    }
  )

  it('should throw error if insert fails', async () => {
    const entityManager = {
      insert: jest.fn().mockRejectedValue(new Error('Failed to insert')),
    } as any
    const entityId = 1
    const original = {}
    const modified = {}
    const actor = new RequestUser(
      '7341a294-7a51-4fdc-90c6-af58e6bea690',
      'actor',
      'actor',
      'actor'
    )

    await expect(
      service.append(
        entityId,
        original,
        modified,
        AuditActor.convertFrom(actor),
        Action.CREATE,
        entityManager
      )
    ).rejects.toThrow('Failed to insert')
  })
})
