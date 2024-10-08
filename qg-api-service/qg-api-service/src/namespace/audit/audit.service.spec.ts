import { RequestUser } from '../module.utils'
import { Action, AuditActor, AuditEntity } from './audit.entity'
import { AuditService } from './audit.service'

describe('Audit Service', () => {
  const service = new AuditService<AuditEntity>(AuditEntity)
  const actor = new RequestUser(
    '7341a294-7a51-4fdc-90c6-af58e6bea690',
    'actor',
    'actor',
    'actor'
  )

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it.each(['create', 'update', 'delete'])(
    'should add audit for %s action',
    async (action: Action) => {
      const entityManager = {
        insert: jest.fn(),
      } as any
      const namespaceId = 1
      const entityId = 1
      const original = { a: 'a' }
      const modified = { b: 'b' }

      await service.append(
        namespaceId,
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
          namespace: { id: namespaceId },
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
    const namespaceId = 1
    const entityId = 1
    const original = {}
    const modified = {}

    await expect(
      service.append(
        namespaceId,
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
