import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { EntityManager, QueryRunner, Repository } from 'typeorm'
import { ConfigEntity } from '../configs/config.entity'
import { RequestUser } from '../module.utils'
import { Run } from '../run/run.entity'
import { UsersService } from '../users/users.service'
import { ApprovalEntity } from './approvals/approvals.entity'
import { ApprovalService } from './approvals/approvals.service'
import { ApprovalState } from './approvals/approvals.util'
import { CommentsService } from './comments/comments.service'
import { OverridesService } from './overrides/overrides.service'
import {
  ReleaseAuditEntity,
  ReleaseAuditService,
  ReleaseEntity,
} from './release.entity'
import { ReleasesService } from './releases.service'
import { TaskService } from './tasks/tasks.service'

describe('ReleasesService', () => {
  let service: ReleasesService
  let queryRunner: QueryRunner
  let auditService: ReleaseAuditService
  let __releaseRepository: Repository<ReleaseEntity>
  let __auditRepository: Repository<ReleaseAuditEntity>
  let __runRepository: Repository<Run>

  const user1 = {
    id: '7341a294-7a51-4fdc-90c6-af58e6bea690',
    email: 'mail@host.invalid',
    username: 'user1',
    displayName: 'User 1',
  } as RequestUser
  const user2 = {
    id: '8451a294-7a51-4fdc-90c6-af58e6bea690',
    email: 'mail@host.invalid',
    username: 'user2',
    displayName: 'User 2',
  } as RequestUser

  let release: ReleaseEntity | undefined
  let approval: ApprovalEntity | undefined
  let runs: Run[]

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    const module = await Test.createTestingModule({
      providers: [
        ReleasesService,
        ReleaseAuditService,
        {
          provide: getRepositoryToken(ReleaseEntity),
          useValue: {
            manager: {
              connection: {
                createQueryRunner: jest.fn(() => queryRunner),
              },
            },
            clear: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReleaseAuditEntity),
          useValue: {
            clear: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Run),
          useValue: {
            find: jest.fn().mockResolvedValue(runs),
          },
        },
        {
          provide: ApprovalService,
          useValue: {
            getApprovalStateWithTransaction: jest.fn(),
            removeAllWithTransaction: jest.fn(),
            computeAggregateApproval: jest.fn().mockReturnValue('pending'),
          },
        },
        {
          provide: OverridesService,
          useValue: {
            removeAllWithTransaction: jest.fn(),
          },
        },
        {
          provide: TaskService,
          useValue: {
            removeAllWithTransaction: jest.fn(),
          },
        },
        {
          provide: CommentsService,
          useValue: {
            removeAllWithTransaction: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUser: jest.fn().mockReturnValue(user1),
          },
        },
      ],
    }).compile()

    service = module.get(ReleasesService)
    auditService = module.get(ReleaseAuditService)
    __releaseRepository = module.get(getRepositoryToken(ReleaseEntity))
    __auditRepository = module.get(getRepositoryToken(ReleaseAuditEntity))
    __runRepository = module.get(getRepositoryToken(Run))
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOneOrFail: jest.fn() as any,
        findOne: jest.fn() as any,
        find: jest.fn() as any,
        save: jest.fn() as any,
        delete: jest.fn() as any,
        getRepository: jest.fn() as any,
      } as EntityManager,
    } as any

    release = new ReleaseEntity()
    release.id = 1
    release.namespace = { id: 1 } as any
    release.name = 'name'
    release.approvalMode = 'one'
    release.config = { id: 1 } as ConfigEntity
    release.plannedDate = new Date()
    release.createdBy = user1.id
    release.lastModifiedBy = user1.id
    release.creationTime = new Date()
    release.lastModificationTime = new Date()
    release.closed = false
    release.approvalState = ApprovalState.PENDING

    approval = new ApprovalEntity()
    approval.id = 2
    approval.namespace = { id: 1 } as any
    approval.release = { id: 1 } as any
    approval.approvalState = ApprovalState.PENDING
    approval.approver = user1.id
    approval.createdBy = user1.id
    approval.creationTime = new Date()
    approval.lastModifiedBy = user1.id
    approval.lastModificationTime = new Date()

    const lastRun = new Run()
    lastRun.id = 1
    lastRun.namespace = { id: 1 } as any
    lastRun.config = { id: 1 } as any
    lastRun.completionTime = new Date()
    lastRun.creationTime = new Date()
    runs = [lastRun]
  })

  describe('list', () => {
    it('should return a list of releases', async () => {
      const listQueryHandler: any = {
        sortBy: 'id',
        addToQueryBuilder: jest.fn(),
      }
      const listWithTransactionSpy = jest.spyOn(service, 'listWithTransaction')
      const findRunSpy = jest.spyOn(__runRepository, 'find')
      const entityList = {
        itemCount: 1,
        entities: [release],
      }
      const approvalList = {
        itemCount: 1,
        entities: [approval],
      }
      listWithTransactionSpy.mockResolvedValue({
        releases: entityList,
        approvals: approvalList,
      })
      findRunSpy.mockResolvedValue(runs)

      const result = await service.list(1, listQueryHandler)
      expect(result).toEqual(
        await service.toEntityList(entityList, approvalList)
      )
    })
  })

  describe('listWithTransaction', () => {
    function mockQueryBuilder(
      itemCount: number,
      entities: ReleaseEntity[],
      approvals: ApprovalEntity[]
    ) {
      return jest.spyOn(queryRunner.manager, 'getRepository').mockReturnValue({
        createQueryBuilder() {
          return {
            leftJoinAndSelect() {
              return this
            },
            where() {
              return this
            },
            async getCount() {
              return itemCount as any
            },
            async getRawAndEntities() {
              return {
                entities,
              }
            },
          }
        },
        async find() {
          return approvals
        },
      } as any)
    }

    it('should return a list of releases', async () => {
      mockQueryBuilder(1, [release], [approval])
      const listQueryHandler: any = {
        sortBy: 'id',
        addToQueryBuilder: jest.fn(),
      }
      const entityList = {
        itemCount: 1,
        entities: [release],
      }
      const approvalList = {
        itemCount: 1,
        entities: [approval],
      }

      const result = await service.listWithTransaction(
        queryRunner,
        1,
        listQueryHandler
      )
      expect(result).toEqual({
        releases: entityList,
        approvals: approvalList,
      })
      verifyTransactionNotCalled(queryRunner)
    })
  })

  describe('get', () => {
    it('should return a release', async () => {
      const getWithTransactionSpy = jest.spyOn(service, 'getWithTransaction')
      getWithTransactionSpy.mockResolvedValue(release)
      const getApprovalStateWithTransactionSpy = jest.spyOn(
        service,
        'getApprovalStateWithTransaction'
      )
      getApprovalStateWithTransactionSpy.mockResolvedValue(
        approval.approvalState
      )

      const result = await service.get(1, 1)

      expect(result).toEqual(
        await service.toReleaseDto(release, ApprovalState.PENDING)
      )
      expect(getWithTransactionSpy).toHaveBeenCalledWith(
        expect.anything(),
        1,
        1
      )
      verifySuccessfullTransaction(queryRunner)
    })

    it('should rollback the transaction if an error occurs', async () => {
      const getWithTransactionSpy = jest.spyOn(service, 'getWithTransaction')
      getWithTransactionSpy.mockRejectedValue(new Error('some error'))
      const getApprovalStateWithTransactionSpy = jest.spyOn(
        service,
        'getApprovalStateWithTransaction'
      )
      getApprovalStateWithTransactionSpy.mockResolvedValue(
        approval.approvalState
      )

      await expect(service.get(1, 1)).rejects.toThrowError()
      expect(getWithTransactionSpy).toHaveBeenCalledWith(
        expect.anything(),
        1,
        1
      )
      verifyFailedTransaction(queryRunner)
    })
  })

  describe('getWithTransaction', () => {
    it('should return a release', async () => {
      const release = new ReleaseEntity()
      jest
        .spyOn(queryRunner.manager, 'findOneOrFail')
        .mockResolvedValue(release)

      const result = await service.getWithTransaction(queryRunner, 1, 1)

      expect(result).toEqual(release)
      verifyTransactionNotCalled(queryRunner)
    })

    it('should rollback the transaction if an error occurs', async () => {
      jest
        .spyOn(queryRunner.manager, 'findOneOrFail')
        .mockRejectedValue(new Error('some error'))

      await expect(
        service.getWithTransaction(queryRunner, 1, 1)
      ).rejects.toThrowError()
      verifyTransactionNotCalled(queryRunner)
    })
  })

  describe('create', () => {
    it('should create a release', async () => {
      const createWithTransactionSpy = jest.spyOn(
        service,
        'createWithTransaction'
      )
      createWithTransactionSpy.mockResolvedValue(release)
      const getApprovalStateWithTransactionSpy = jest.spyOn(
        service,
        'getApprovalStateWithTransaction'
      )
      getApprovalStateWithTransactionSpy.mockResolvedValue(
        approval.approvalState
      )

      const result = await service.create(
        1,
        'name',
        'one',
        1,
        new Date(),
        user1
      )

      expect(createWithTransactionSpy).toHaveBeenCalledWith(
        expect.anything(),
        1,
        'name',
        'one',
        1,
        expect.any(Date),
        expect.any(Object)
      )
      const releaseDto = await service.toReleaseDto(
        release,
        ApprovalState.PENDING
      )
      expect(result).toEqual(releaseDto)
      verifySuccessfullTransaction(queryRunner)
    })

    it('should throw an error if the release creation fails', async () => {
      const createWithTransactionSpy = jest.spyOn(
        service,
        'createWithTransaction'
      )
      createWithTransactionSpy.mockRejectedValue(new Error('some error'))

      await expect(
        service.create(1, 'name', 'one', 1, new Date(), user1)
      ).rejects.toThrowError()
    })
  })

  describe('createWithTransaction', () => {
    it('should create a release and an audit entry', async () => {
      const releaseWithoutId = release.DeepCopy()
      delete releaseWithoutId['id']
      const findOneSpy = jest.spyOn(queryRunner.manager, 'findOne')
      const saveSpy = jest.spyOn(queryRunner.manager, 'save')
      const auditServiceSpy = jest.spyOn(auditService, 'append')

      findOneSpy.mockResolvedValueOnce({ id: 1 })
      saveSpy.mockResolvedValueOnce(release)
      auditServiceSpy.mockResolvedValueOnce()

      const result = await service.createWithTransaction(
        queryRunner,
        release.namespace.id,
        release.name,
        release.approvalMode,
        release.config.id,
        release.plannedDate,
        user1
      )

      expect(saveSpy).toHaveBeenCalledWith({
        ...releaseWithoutId,
      })
      expect(auditServiceSpy).toHaveBeenCalledWith(
        release.namespace.id,
        release.id,
        {},
        release,
        user1,
        'create',
        expect.anything()
      )
      expect(result).toEqual(release)
      verifyTransactionNotCalled(queryRunner)
    })

    it('should throw an error if saving the release fails', async () => {
      const saveSpy = jest.spyOn(queryRunner.manager, 'save')
      saveSpy.mockRejectedValue(new Error('some error'))

      await expect(
        service.createWithTransaction(
          queryRunner,
          1,
          'name',
          'one',
          1,
          new Date(),
          user1
        )
      ).rejects.toThrowError()
    })

    it('should throw an error if saving the audit entry fails', async () => {
      const saveSpy = jest.spyOn(queryRunner.manager, 'save')
      const auditServiceSpy = jest.spyOn(auditService, 'append')

      saveSpy.mockResolvedValueOnce(new ReleaseEntity())
      auditServiceSpy.mockRejectedValue(new Error('some error'))

      await expect(
        service.createWithTransaction(
          queryRunner,
          1,
          'name',
          'one',
          1,
          new Date(),
          user1
        )
      ).rejects.toThrowError()
    })
  })

  describe('update', () => {
    it('should update a release', async () => {
      const nowDate = new Date()
      const updateWithTransactionSpy = jest.spyOn(
        service,
        'updateWithTransaction'
      )
      updateWithTransactionSpy.mockResolvedValue(release)
      const getApprovalStateWithTransactionSpy = jest.spyOn(
        service,
        'getApprovalStateWithTransaction'
      )
      getApprovalStateWithTransactionSpy.mockResolvedValue(
        approval.approvalState
      )

      const result = await service.update(1, 1, user1, 'name', 'one', nowDate)

      expect(updateWithTransactionSpy).toHaveBeenCalledWith(
        expect.anything(),
        1,
        1,
        user1,
        'name',
        'one',
        nowDate
      )
      const releaseDto = await service.toReleaseDto(
        release,
        ApprovalState.PENDING
      )
      expect(result).toEqual(releaseDto)
      verifySuccessfullTransaction(queryRunner)
    })

    it('should throw an error if the release update fails', async () => {
      const updateWithTransactionSpy = jest.spyOn(
        service,
        'updateWithTransaction'
      )
      updateWithTransactionSpy.mockRejectedValue(new Error('some error'))

      await expect(
        service.update(1, 1, user1, 'name', 'one', new Date())
      ).rejects.toThrowError()
    })
  })

  describe('updateWithTransaction', () => {
    it('should update a release and create an audit entry', async () => {
      const currentRelease = release
      const originalRelease = currentRelease.DeepCopy()
      const updatedRelease = {
        ...currentRelease,
        name: 'name2',
        approvalMode: 'all',
        lastModifiedBy: user2.id,
        lastModificationTime: expect.any(Date),
      }
      const getWithTransactionSpy = jest.spyOn(service, 'getWithTransaction')
      const findSpy = jest.spyOn(queryRunner.manager, 'find')
      const saveSpy = jest.spyOn(queryRunner.manager, 'save')
      const auditServiceSpy = jest.spyOn(auditService, 'append')

      getWithTransactionSpy.mockResolvedValueOnce(currentRelease)
      saveSpy.mockImplementationOnce((entity) => Promise.resolve(entity))
      findSpy.mockResolvedValueOnce([approval])
      auditServiceSpy.mockResolvedValueOnce()

      const result = await service.updateWithTransaction(
        queryRunner,
        1,
        1,
        user2,
        'name2',
        'all',
        new Date()
      )

      expect(getWithTransactionSpy).toHaveBeenCalledWith(queryRunner, 1, 1)
      expect(findSpy).toHaveBeenCalled()
      expect(saveSpy).toHaveBeenCalledWith(updatedRelease)
      expect(auditServiceSpy).toHaveBeenCalledWith(
        originalRelease.namespace.id,
        originalRelease.id,
        originalRelease,
        updatedRelease,
        user2,
        'update',
        expect.anything()
      )
      expect(result).toEqual(currentRelease)
      verifyTransactionNotCalled(queryRunner)
    })

    it('should throw an error if saving the release fails', async () => {
      const saveSpy = jest.spyOn(queryRunner.manager, 'save')
      saveSpy.mockRejectedValue(new Error('some error'))

      await expect(
        service.updateWithTransaction(
          queryRunner,
          1,
          1,
          user1,
          'name',
          'one',
          new Date()
        )
      ).rejects.toThrowError()
    })

    it('should throw an error if saving the audit entry fails', async () => {
      const saveSpy = jest.spyOn(queryRunner.manager, 'save')
      const auditServiceSpy = jest.spyOn(auditService, 'append')

      saveSpy.mockResolvedValueOnce(new ReleaseEntity())
      auditServiceSpy.mockRejectedValue(new Error('some error'))

      await expect(
        service.updateWithTransaction(
          queryRunner,
          1,
          1,
          user1,
          'name',
          'one',
          new Date()
        )
      ).rejects.toThrowError()
    })
  })

  describe('remove', () => {
    it('should delete a release', async () => {
      const deleteWithTransactionSpy = jest.spyOn(
        service,
        'removeWithTransaction'
      )
      deleteWithTransactionSpy.mockResolvedValue()

      await service.remove(1, 1, user1)

      expect(deleteWithTransactionSpy).toHaveBeenCalledWith(
        expect.anything(),
        1,
        1,
        user1
      )
      verifySuccessfullTransaction(queryRunner)
    })

    it('should throw an error if the release deletion fails', async () => {
      const deleteWithTransactionSpy = jest.spyOn(
        service,
        'removeWithTransaction'
      )
      deleteWithTransactionSpy.mockRejectedValue(new Error('some error'))

      await expect(service.remove(1, 1, user1)).rejects.toThrowError()
    })
  })

  describe('deleteWithTransaction', () => {
    it('should delete a release and create an audit entry', async () => {
      const releaseWithId = { ...release, id: 1 } as ReleaseEntity
      const getWithTransactionSpy = jest.spyOn(service, 'getWithTransaction')
      const deleteSpy = jest.spyOn(queryRunner.manager, 'delete')
      const auditServiceSpy = jest.spyOn(auditService, 'append')

      getWithTransactionSpy.mockResolvedValueOnce(releaseWithId)
      deleteSpy.mockResolvedValueOnce({} as any)
      auditServiceSpy.mockResolvedValueOnce()

      await service.removeWithTransaction(queryRunner, 1, 1, user2)

      expect(getWithTransactionSpy).toHaveBeenCalledWith(queryRunner, 1, 1)
      expect(deleteSpy).toHaveBeenCalledWith(ReleaseEntity, {
        id: 1,
        namespace: { id: release.namespace.id },
      })
      expect(auditServiceSpy).toHaveBeenCalledWith(
        1,
        1,
        releaseWithId,
        {},
        user2,
        'delete',
        expect.anything()
      )
      verifyTransactionNotCalled(queryRunner)
    })

    it('should throw an error if deleting the release fails', async () => {
      const deleteSpy = jest.spyOn(queryRunner.manager, 'delete')
      deleteSpy.mockRejectedValue(new Error('some error'))

      await expect(
        service.removeWithTransaction(queryRunner, 1, 1, user1)
      ).rejects.toThrowError()
    })

    it('should throw an error if saving the audit entry fails', async () => {
      const deleteSpy = jest.spyOn(queryRunner.manager, 'delete')
      const auditServiceSpy = jest.spyOn(auditService, 'append')

      deleteSpy.mockResolvedValueOnce({} as any)
      auditServiceSpy.mockRejectedValue(new Error('some error'))

      await expect(
        service.removeWithTransaction(queryRunner, 1, 1, user1)
      ).rejects.toThrowError()
    })

    it('should throw an error if the release does not exist', async () => {
      const getWithTransactionSpy = jest.spyOn(service, 'getWithTransaction')
      getWithTransactionSpy.mockRejectedValue(new Error('some error'))

      await expect(
        service.removeWithTransaction(queryRunner, 1, 1, user1)
      ).rejects.toThrowError()
    })
  })

  describe('toReleaseDto', () => {
    it('should convert a release entity to a release dto', async () => {
      const releaseDto = await service.toReleaseDto(
        release,
        ApprovalState.PENDING
      )
      expect({ ...releaseDto }).toEqual({
        id: release.id,
        name: release.name,
        approvalMode: release.approvalMode,
        approvalState: 'pending',
        qgConfigId: release.config.id,
        createdBy: user1,
        lastModifiedBy: user1,
        plannedDate: release.plannedDate,
        creationTime: release.creationTime,
        lastModificationTime: release.lastModificationTime,
        closed: release.closed,
        lastRunId: runs[0].id,
      })
    })
    it('should use the stored lastRunIdAfterClose if the release is closed', async () => {
      release.closed = true
      const releaseDto = await service.toReleaseDto(
        release,
        ApprovalState.PENDING
      )
      expect({ ...releaseDto }).toEqual({
        id: release.id,
        name: release.name,
        approvalMode: release.approvalMode,
        approvalState: 'pending',
        qgConfigId: release.config.id,
        createdBy: user1,
        lastModifiedBy: user1,
        plannedDate: release.plannedDate,
        creationTime: release.creationTime,
        lastModificationTime: release.lastModificationTime,
        closed: release.closed,
        lastRunId: runs[0].id,
      })
    })
  })

  describe('toEntityList', () => {
    it('should convert a list of release entities to a list of release dtos', async () => {
      const entityList = {
        itemCount: 1,
        entities: [release],
      }
      const approvalList = {
        itemCount: 1,
        entities: [approval],
      }
      const releaseDtoList = await service.toEntityList(
        entityList,
        approvalList
      )
      expect(releaseDtoList).toEqual({
        itemCount: 1,
        entities: [
          {
            id: release.id,
            name: release.name,
            approvalMode: release.approvalMode,
            approvalState: approval.approvalState,
            qgConfigId: release.config.id,
            createdBy: user1,
            lastModifiedBy: user1,
            plannedDate: release.plannedDate,
            creationTime: release.creationTime,
            lastModificationTime: release.lastModificationTime,
            closed: release.closed,
            lastRunId: runs[0].id,
          },
        ],
      })
    })
  })
})

function verifySuccessfullTransaction(queryRunner: QueryRunner) {
  expect(queryRunner.startTransaction).toHaveBeenCalled()
  expect(queryRunner.commitTransaction).toHaveBeenCalled()
  expect(queryRunner.release).toHaveBeenCalled()
  expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled()
}

function verifyFailedTransaction(queryRunner: QueryRunner) {
  expect(queryRunner.startTransaction).toHaveBeenCalled()
  expect(queryRunner.commitTransaction).not.toHaveBeenCalled()
  expect(queryRunner.release).toHaveBeenCalled()
  expect(queryRunner.rollbackTransaction).toHaveBeenCalled()
}

function verifyTransactionNotCalled(queryRunner: QueryRunner) {
  expect(queryRunner.commitTransaction).not.toHaveBeenCalled()
  expect(queryRunner.release).not.toHaveBeenCalled()
  expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled()
}
