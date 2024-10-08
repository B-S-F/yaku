import { SortOrder } from '@B-S-F/api-commons-lib'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuditEntity } from '../audit/audit.entity'
import { RunAuditService } from '../run/run.entity'
import { UsersService } from '../users/users.service'
import { ApprovalAuditService } from './approvals/approvals.entity'
import { ApprovalState } from './approvals/approvals.util'
import { CommentsService } from './comments/comments.service'
import { HistoryService } from './history.service'
import {
  HistoryFilter,
  HistoryItem,
  HistoryQueryOptions,
  HistoryType,
} from './history.utils'
import { OverrideAuditService } from './overrides/override.entity'
import { ReleaseAuditService, ReleaseEntity } from './release.entity'

describe('HistoryService', () => {
  let service: HistoryService
  let releaseAuditService: ReleaseAuditService
  let approvalAuditService: ApprovalAuditService
  let runAuditService: RunAuditService
  let commentService: CommentsService
  let releaseRepository: Repository<ReleaseEntity>

  const user1 = {
    id: 'user1_id',
    username: 'user1',
    email: 'user1@example.com',
    displayName: 'User 1',
    firstName: 'User',
    lastName: '1',
  }
  const user2 = {
    id: 'user2_id',
    username: 'user2',
    email: 'user2@example.com',
    displayName: 'User 2',
    firstName: 'User',
    lastName: '2',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        {
          provide: ReleaseAuditService,
          useValue: {
            list: jest.fn(),
          },
        },
        {
          provide: ApprovalAuditService,
          useValue: {
            list: jest.fn(),
          },
        },
        {
          provide: RunAuditService,
          useValue: {
            list: jest.fn(),
          },
        },
        {
          provide: OverrideAuditService,
          useValue: {
            list: jest.fn(),
          },
        },
        {
          provide: CommentsService,
          useValue: {
            listCommentsByType: jest.fn(),
            listCommentsByStatus: jest.fn(),
            listComments: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUser: jest.fn().mockImplementation((id) => {
              if (id === user1.id) {
                return user1
              }
              if (id === user2.id) {
                return user2
              }
              if (id === user1.username) {
                return user1
              }
            }),
          },
        },
        {
          provide: getRepositoryToken(ReleaseEntity),
          useValue: {
            manager: {
              connection: {
                createQueryRunner: jest.fn(),
              },
            },
          },
        },
      ],
    }).compile()

    service = module.get<HistoryService>(HistoryService)
    releaseAuditService = module.get<ReleaseAuditService>(ReleaseAuditService)
    approvalAuditService =
      module.get<ApprovalAuditService>(ApprovalAuditService)
    commentService = module.get<CommentsService>(CommentsService)
    releaseRepository = module.get<Repository<ReleaseEntity>>(
      getRepositoryToken(ReleaseEntity)
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('extractMarkers', () => {
    it('should extract pagination markers', () => {
      const queryOptions: HistoryQueryOptions = {
        sortOrder: SortOrder.ASC,
        items: 10,
        lastTimestamp: 1612137600000,
      }

      const result = service.extractMarkers(queryOptions, new Date(0))

      expect(result).toEqual({
        lastTimestamp: new Date('2021-02-01T00:00:00.000Z'),
        amount: 10,
        direction: 'after',
      })
    })

    it('should return start timestamp based on sort order if none is passed', () => {
      const queryOptions: HistoryQueryOptions = {
        sortOrder: SortOrder.DESC,
        items: 20,
      }

      const resultDesc = service.extractMarkers(queryOptions, new Date(0))
      expect(resultDesc.lastTimestamp.getTime()).toBeGreaterThan(
        new Date().getTime() - 1000
      )

      queryOptions.sortOrder = SortOrder.ASC
      const resultAsc = service.extractMarkers(queryOptions, new Date(0))
      expect(resultAsc.lastTimestamp).toEqual(new Date(0))
    })
  })

  describe('historieItems', () => {
    let historyItems: HistoryItem[]

    beforeEach(() => {
      historyItems = [
        {
          type: HistoryType.EVENT,
          data: {
            actor: user1,
            action: 'created',
          },
          timestamp: new Date('2021-02-01T00:00:00.000Z'),
        },
        {
          type: HistoryType.EVENT,
          data: {
            actor: user2,
            action: 'updated',
          },
          timestamp: new Date('2021-02-02T00:00:00.000Z'),
        },
        {
          type: HistoryType.EVENT,
          data: {
            actor: user1,
            action: 'updated',
          },
          timestamp: new Date('2021-02-03T00:00:00.000Z'),
        },
        {
          type: HistoryType.EVENT,
          data: {
            actor: user1,
            action: 'updated',
          },
          timestamp: new Date('2021-02-03T00:00:00.000Z'),
        },
        {
          type: HistoryType.COMMENT,
          data: {} as any,
          timestamp: new Date('2021-02-04T00:00:00.000Z'),
        },
      ]
    })

    describe('filterHistoryItems', () => {
      it('should return all history items if no filter is provided', () => {
        const result = service.filterHistoryItems(historyItems, undefined)
        expect(result).toEqual(historyItems)
      })

      it('should return only history items that match the specified filter', () => {
        const result = service.filterHistoryItems(
          historyItems,
          HistoryFilter.EVENT
        )
        expect(result).toEqual([
          historyItems[0],
          historyItems[1],
          historyItems[2],
          historyItems[3],
        ])

        const result4 = service.filterHistoryItems(
          historyItems,
          HistoryFilter.RESOLVED
        )
        expect(result4).toEqual([historyItems[4]])

        const result5 = service.filterHistoryItems(
          historyItems,
          HistoryFilter.UNRESOLVED
        )
        expect(result5).toEqual([historyItems[4]])
      })
    })

    describe('sortHistoryItems', () => {
      it('should sort history items ascending by timestamp', () => {
        const historyItemsDeepCopy = JSON.parse(JSON.stringify(historyItems))
        for (const item of historyItemsDeepCopy) {
          item.timestamp = new Date(item.timestamp)
        }
        service.sortHistoryItems(historyItems, SortOrder.ASC)
        expect(historyItems).toEqual(historyItemsDeepCopy)
      })

      it('should sort history items descending by timestamp', () => {
        const historyItemsDeepCopy = JSON.parse(JSON.stringify(historyItems))
        for (const item of historyItemsDeepCopy) {
          item.timestamp = new Date(item.timestamp)
        }
        service.sortHistoryItems(historyItems, SortOrder.DESC)
        historyItemsDeepCopy.reverse()
        expect(historyItems).toEqual(historyItemsDeepCopy)
      })
    })

    describe('limitHistoryItems', () => {
      it('should limit the amount of history items', () => {
        const result = service.limitHistoryItems(historyItems, 3)
        expect(result).toEqual(historyItems.slice(0, 3))
      })
    })

    describe('calculateNewLastTimestamp', () => {
      it('should return the adjusted last timestamp when direction is "before"', () => {
        const lastTimestamp = new Date('2021-02-03T00:00:00.000Z')
        const direction = 'before'

        const result = service.calculateNewLastTimestamp(
          historyItems,
          lastTimestamp,
          direction
        )
        expect(result).toEqual(new Date('2021-02-03T23:59:59.999Z'))
      })

      it('should return the adjusted last timestamp when direction is "after"', () => {
        const lastTimestamp = new Date('2021-02-01T00:00:00.000Z')
        const direction = 'after'

        const result = service.calculateNewLastTimestamp(
          historyItems,
          lastTimestamp,
          direction
        )
        expect(result).toEqual(new Date('2021-02-04T00:00:00.001Z'))
      })
    })

    describe('toHistoryItemDto', () => {
      it('should convert history items to history item dtos', () => {
        const result = service.toHistoryItemDto(historyItems[0])
        expect(result.data).toEqual(historyItems[0].data)
        expect(result.timestamp).toEqual(historyItems[0].timestamp)
        expect(result.type).toEqual(historyItems[0].type)
      })
    })
  })

  describe('approvalAuditToHistoryItem', () => {
    it('should convert update audit entity to a approved history items', async () => {
      const approvalAuditApproved = {
        action: 'update',
        actor: user1,
        original: {
          approvalState: ApprovalState.PENDING,
        },
        modified: {
          approvalState: ApprovalState.APPROVED,
        },
        modificationTime: new Date('2021-02-01T00:00:00.000Z'),
      } as any

      const result = await service.approvalAuditToHistoryItem(
        approvalAuditApproved
      )
      expect(result.type).toEqual(HistoryType.EVENT)
      expect(result.timestamp).toEqual(approvalAuditApproved.modificationTime)
      expect(result.data).toEqual({
        actor: user1,
        action: 'approved',
      })
    })

    it('should convert update audit entity to a reset history items', async () => {
      const approvalAuditApproved = {
        action: 'update',
        actor: user1,
        original: {
          approvalState: ApprovalState.APPROVED,
        },
        modified: {
          approvalState: ApprovalState.PENDING,
        },
        modificationTime: new Date('2021-02-01T00:00:00.000Z'),
      } as any

      const result = await service.approvalAuditToHistoryItem(
        approvalAuditApproved
      )
      expect(result.type).toEqual(HistoryType.EVENT)
      expect(result.timestamp).toEqual(approvalAuditApproved.modificationTime)
      expect(result.data).toEqual({
        actor: user1,
        action: 'reset',
      })
    })

    it('should convert create audit entity to a created history items', async () => {
      const approvalAuditCreated = {
        action: 'create',
        actor: user1,
        modified: {
          approvalState: ApprovalState.PENDING,
          approver: user2.id,
        },
        modificationTime: new Date('2021-02-01T00:00:00.000Z'),
      } as any

      const result = await service.approvalAuditToHistoryItem(
        approvalAuditCreated
      )
      expect(result.type).toEqual(HistoryType.EVENT)

      expect(result.timestamp).toEqual(approvalAuditCreated.modificationTime)
      expect(result.data).toEqual({
        actor: user1,
        action: 'added User 2',
      })
    })

    it('should convert delete audit entity to a deleted history items', async () => {
      const approvalAuditDeleted = {
        action: 'delete',
        actor: user1,
        original: {
          approvalState: ApprovalState.PENDING,
          approver: user2.id,
        },
        modificationTime: new Date('2021-02-01T00:00:00.000Z'),
      } as any

      const result = await service.approvalAuditToHistoryItem(
        approvalAuditDeleted
      )
      expect(result.type).toEqual(HistoryType.EVENT)
      expect(result.timestamp).toEqual(approvalAuditDeleted.modificationTime)
      expect(result.data).toEqual({
        actor: user1,
        action: 'removed User 2',
      })
    })
  })

  describe('releaseAuditToHistoryItem', () => {
    it('should convert name update audit entity to a updated history items', async () => {
      const releaseAuditUpdated = {
        action: 'update',
        actor: user1,
        original: {
          name: 'release1',
        },
        modified: {
          name: 'release2',
        },
        modificationTime: new Date('2021-02-01T00:00:00.000Z'),
      } as any

      const result = await service.releaseAuditToHistoryItem(
        releaseAuditUpdated
      )
      expect(result.type).toEqual(HistoryType.EVENT)
      expect(result.timestamp).toEqual(releaseAuditUpdated.modificationTime)
      expect(result.data).toEqual({
        actor: user1,
        action: 'updated name',
      })
    })

    it('should convert plannedDate update audit entity to a updated history items', async () => {
      const releaseAuditUpdated = {
        action: 'update',
        actor: user1,
        original: {
          plannedDate: '2021-02-01T00:00:00.000Z',
        },
        modified: {
          plannedDate: '2021-02-02T00:00:00.000Z',
        },
        modificationTime: new Date('2021-02-01T00:00:00.000Z'),
      } as any

      const result = await service.releaseAuditToHistoryItem(
        releaseAuditUpdated
      )
      expect(result.type).toEqual(HistoryType.EVENT)
      expect(result.timestamp).toEqual(releaseAuditUpdated.modificationTime)
      expect(result.data).toEqual({
        actor: user1,
        action: 'updated plannedDate',
      })
    })

    it('should convert closed update audit entity to a updated history items', async () => {
      const releaseAuditUpdated = {
        action: 'update',
        actor: user1,
        original: {
          closed: false,
        },
        modified: {
          closed: true,
        },
        modificationTime: new Date('2021-02-01T00:00:00.000Z'),
      } as any

      const result = await service.releaseAuditToHistoryItem(
        releaseAuditUpdated
      )
      expect(result.type).toEqual(HistoryType.EVENT)
      expect(result.timestamp).toEqual(releaseAuditUpdated.modificationTime)
      expect(result.data).toEqual({
        actor: user1,
        action: 'closed',
      })
    })
  })

  describe('runAuditToHistoryItem', () => {
    it.each(['GREEN', 'YELLOW', 'RED'])(
      'should convert status updates to completed as history items',
      async (status) => {
        const runAuditCompleted = {
          action: 'update',
          actor: user1,
          original: {
            status: 'running',
          },
          modified: {
            id: 1,
            status: 'completed',
            overallResult: status,
          },
          modificationTime: new Date('2021-02-01T00:00:00.000Z'),
        } as any

        const result = await service.runAuditToHistoryItem(runAuditCompleted)
        expect(result).toBeDefined()
        expect(result.type).toEqual(HistoryType.EVENT)
        expect(result.timestamp).toEqual(runAuditCompleted.modificationTime)
        expect(result.data).toEqual({
          actor: user1,
          action: `run 1 succeeded with status ${status} and automatically resolved its findings`,
        })
      }
    )

    it('should handle failed overallResult', async () => {
      const runAuditCompleted = {
        action: 'update',
        actor: user1,
        original: {
          status: 'running',
        },
        modified: {
          id: 1,
          status: 'completed',
          overallResult: 'FAILED',
        },
        modificationTime: new Date('2021-02-01T00:00:00.000Z'),
      } as any

      const result = await service.runAuditToHistoryItem(runAuditCompleted)
      expect(result.data).toEqual({
        actor: user1,
        action: 'run 1 failed',
      })
    })

    it('should handle failed status', async () => {
      const runAuditCompleted = {
        action: 'update',
        actor: user1,
        original: {
          status: 'running',
        },
        modified: {
          status: 'FAILED',
        },
        modificationTime: new Date('2021-02-01T00:00:00.000Z'),
      } as any

      const result = await service.runAuditToHistoryItem(runAuditCompleted)
      expect(result).toBeUndefined()
    })

    it('should ignore runs that happened before the release was created', async () => {
      const runAuditCompleted = {
        action: 'update',
        actor: user1,
        original: {
          status: 'running',
        },
        modified: {
          id: 1,
          status: 'completed',
          overallResult: 'GREEN',
        },
        modificationTime: new Date('2021-01-01T00:00:00.000Z'),
      } as any

      const result = await service.runAuditToHistoryItem(
        runAuditCompleted,
        new Date('2021-01-01T00:00:00.001Z')
      )
      expect(result).toBeUndefined()
    })

    it('should ignore runs that happened after the release was closed', async () => {
      const runAuditCompleted = {
        action: 'update',
        actor: user1,
        original: {
          status: 'running',
        },
        modified: {
          id: 1,
          status: 'completed',
          overallResult: 'GREEN',
        },
        modificationTime: new Date('2021-03-01T00:00:00.001Z'),
      } as any

      const result = await service.runAuditToHistoryItem(
        runAuditCompleted,
        undefined,
        new Date('2021-01-01T00:00:00.000Z')
      )
      expect(result).toBeUndefined()
    })
  })

  describe('migration', () => {
    it('should support actors with only username', async () => {
      const actor = { username: user1.username }
      const audit = { actor } as unknown as AuditEntity
      const result = await service['retrieveAuditActor'](audit)
      expect(result).toEqual(user1)
    })
  })
})
