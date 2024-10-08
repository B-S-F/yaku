import { ConfigEntity } from '../configs/config.entity'
import { ApprovalState } from './approvals/approvals.util'
import { ReleaseEntity } from './release.entity'

describe('ReleaseEntity', () => {
  it('should create a deepcopy of the release', () => {
    const release = new ReleaseEntity()
    release.id = 1
    release.namespace = { id: 1 } as any
    release.name = 'test'
    release.approvalMode = 'one'
    release.config = { id: 1 } as ConfigEntity
    release.createdBy = 'test'
    release.lastModifiedBy = 'test'
    release.plannedDate = new Date()
    release.creationTime = new Date()
    release.lastModificationTime = new Date()
    release.closed = false
    release.approvalState = ApprovalState.APPROVED

    for (const [key, value] of Object.entries(release)) {
      try {
        expect(value).toBeDefined()
      } catch (error) {
        throw new Error(`Implementation error: ${key} is undefined in deepcopy`)
      }
    }

    const deepcopy = release.DeepCopy()
    expect(deepcopy).toEqual(release)
  })
})
