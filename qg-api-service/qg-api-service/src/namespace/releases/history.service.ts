import { SortOrder, UrlHandler } from '@B-S-F/api-commons-lib'
import { Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryRunner, Repository } from 'typeorm'
import { Action, AuditEntity } from '../audit/audit.entity'
import {
  Run,
  RunAuditEntity,
  RunAuditService,
  RunResult,
  RunStatus,
} from '../run/run.entity'
import { UsersService } from '../users/users.service'
import { UserInNamespaceDto } from '../users/users.utils'
import {
  ApprovalAuditEntity,
  ApprovalAuditService,
  ApprovalEntity,
} from './approvals/approvals.entity'
import { ApprovalState } from './approvals/approvals.util'
import { CommentEntity, CommentStatus } from './comments/comment.entity'
import { CommentsService } from './comments/comments.service'
import { ReferenceType } from './comments/comments.utils'
import {
  AddOverrideHistoryEventData,
  ApprovalHistoryEventData,
  DeleteOverrideHistoryEventData,
  HistoryDto,
  HistoryEventData,
  HistoryFilter,
  HistoryItem,
  HistoryItemDto,
  HistoryQueryOptions,
  HistoryType,
  UpdateOverrideHistoryEventData,
} from './history.utils'
import { getRelease } from './module.utils'
import {
  OverrideAuditEntity,
  OverrideAuditService,
  OverrideEntity,
} from './overrides/override.entity'
import { CheckReference } from './overrides/overrides.utils'
import {
  ReleaseAuditEntity,
  ReleaseAuditService,
  ReleaseEntity,
} from './release.entity'

const LOOKAHEAD_AMOUNT = 100

export class HistoryService {
  constructor(
    @Inject(ReleaseAuditService)
    private readonly releaseAuditService: ReleaseAuditService,
    @Inject(ApprovalAuditService)
    private readonly approvalAuditService: ApprovalAuditService,
    @Inject(RunAuditService)
    private readonly runAuditService: RunAuditService,
    @Inject(OverrideAuditService)
    private readonly overrideAuditService: OverrideAuditService,
    @Inject(CommentsService)
    private readonly commentService: CommentsService,
    @InjectRepository(ReleaseEntity)
    private readonly releaseRepository: Repository<ReleaseEntity>,
    @Inject(UsersService)
    private readonly usersService: UsersService
  ) {}

  async getReleaseHistory(
    namespaceId: number,
    releaseId: number,
    queryOptions: HistoryQueryOptions,
    requestUrl: UrlHandler
  ): Promise<HistoryDto> {
    const querryRunner =
      this.releaseRepository.manager.connection.createQueryRunner()
    try {
      await querryRunner.connect()
      await querryRunner.startTransaction('READ COMMITTED')
      const release = await getRelease(querryRunner, namespaceId, releaseId)
      const releaseHistory = await this.getReleaseHistoryWithTransaction(
        querryRunner,
        namespaceId,
        release,
        queryOptions,
        requestUrl
      )
      await querryRunner.commitTransaction()
      return releaseHistory
    } catch (e) {
      await querryRunner.rollbackTransaction()
      throw e
    } finally {
      await querryRunner.release()
    }
  }

  async getReleaseHistoryWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    release: ReleaseEntity,
    queryOptions: HistoryQueryOptions,
    requestUrl: UrlHandler
  ): Promise<HistoryDto> {
    const { data, lastTimestamp } = await this.retrieveSortedHistoryItems(
      queryRunner,
      namespaceId,
      release,
      queryOptions
    )

    return this.toPaginatedHistoryDto(
      data,
      lastTimestamp,
      queryOptions.sortOrder,
      queryOptions.items,
      requestUrl,
      queryOptions.filter
    )
  }

  toPaginatedHistoryDto(
    data: HistoryItemDto[],
    lastTimestamp: Date,
    sortOrder: SortOrder,
    items: number,
    requestUrl: UrlHandler,
    filter?: HistoryFilter
  ): HistoryDto {
    let appendix = `?items=${items}&sortOrder=${sortOrder}`
    if (filter) {
      appendix += `&filter=${filter}`
    }
    appendix += `&lastTimestamp=${lastTimestamp.getTime()}`
    return {
      data,
      links: {
        next: requestUrl.url(appendix),
      },
    }
  }

  async retrieveSortedHistoryItems(
    queryRunner: QueryRunner,
    namespaceId: number,
    release: ReleaseEntity,
    queryOptions: HistoryQueryOptions
  ): Promise<{
    data: HistoryItemDto[]
    lastTimestamp: Date
  }> {
    const { lastTimestamp, amount, direction } = this.extractMarkers(
      queryOptions,
      release.creationTime
    )

    const approvalHistory = await this.getApprovalHistory(
      queryRunner,
      namespaceId,
      release.id,
      lastTimestamp,
      amount,
      direction
    )

    const commentHistory = await this.getCommentHistory(
      queryRunner,
      namespaceId,
      release.id,
      lastTimestamp,
      amount,
      direction,
      queryOptions.filter
    )

    const releaseHistory = await this.getReleaseAuditHistory(
      queryRunner,
      namespaceId,
      release.id,
      lastTimestamp,
      amount,
      direction
    )

    const runHistory = await this.getRunAuditHistory(
      queryRunner,
      namespaceId,
      release,
      lastTimestamp,
      amount,
      direction
    )

    const overrideHistory = await this.getOverrideHistory(
      queryRunner,
      namespaceId,
      release.id,
      lastTimestamp,
      amount,
      direction
    )

    let historyItems: HistoryItem[] = []
    historyItems.push(...approvalHistory)
    historyItems.push(...commentHistory)
    historyItems.push(...releaseHistory)
    historyItems.push(...runHistory)
    historyItems.push(...overrideHistory)

    historyItems = this.filterHistoryItems(historyItems, queryOptions.filter)
    this.sortHistoryItems(historyItems, queryOptions.sortOrder)
    historyItems = this.limitHistoryItems(historyItems, queryOptions.items)

    const newLastTimestamp = this.calculateNewLastTimestamp(
      historyItems,
      lastTimestamp,
      direction
    )

    const historyItemDtos = historyItems.map((historyItem) =>
      this.toHistoryItemDto(historyItem)
    )

    return {
      data: historyItemDtos,
      lastTimestamp: newLastTimestamp,
    }
  }

  extractMarkers(queryOptions: HistoryQueryOptions, releaseCreationTime) {
    const lastTimestamp = queryOptions.lastTimestamp
      ? new Date(queryOptions.lastTimestamp)
      : queryOptions.sortOrder === 'ASC'
      ? releaseCreationTime
      : new Date()
    const amount = queryOptions.items
    const direction = (
      queryOptions.sortOrder === 'ASC' ? 'after' : 'before'
    ) as 'before' | 'after'
    return {
      lastTimestamp,
      amount,
      direction,
    }
  }

  filterHistoryItems(
    historyItems: HistoryItem[],
    filter: HistoryFilter
  ): HistoryItem[] {
    if (filter === HistoryFilter.EVENT) {
      return historyItems.filter(
        (historyItem) => String(historyItem.type) === String(filter)
      )
    }
    if (
      filter === HistoryFilter.RESOLVED ||
      filter === HistoryFilter.UNRESOLVED
    ) {
      return historyItems.filter(
        (historyItem) => historyItem.type === HistoryType.COMMENT
      )
    }
    return historyItems
  }

  sortHistoryItems(historyItems: HistoryItem[], sortOrder: string): void {
    if (sortOrder === 'ASC') {
      historyItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    } else {
      historyItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    }
  }

  limitHistoryItems(
    historyItems: HistoryItem[],
    amount: number
  ): HistoryItem[] {
    return historyItems.slice(0, amount)
  }

  calculateNewLastTimestamp(
    historyItems: HistoryItem[],
    lastTimestamp: Date,
    direction: 'before' | 'after'
  ): Date {
    const newLastTimestamp = historyItems.length
      ? historyItems[historyItems.length - 1].timestamp
      : lastTimestamp
    // Javascript does not support microsecond timestamps
    // To ensure that the next request will not return the same history items again
    // we need to adjust the lastTimestamp by one milliseconds
    if (direction === 'before')
      if (newLastTimestamp.getMilliseconds() === 0) {
        newLastTimestamp.setMilliseconds(999)
        newLastTimestamp.setSeconds(newLastTimestamp.getSeconds() - 1)
      } else
        newLastTimestamp.setMilliseconds(newLastTimestamp.getMilliseconds() - 1)
    else {
      if (newLastTimestamp.getMilliseconds() === 999) {
        newLastTimestamp.setMilliseconds(0)
        newLastTimestamp.setSeconds(newLastTimestamp.getSeconds() + 1)
      } else
        newLastTimestamp.setMilliseconds(newLastTimestamp.getMilliseconds() + 1)
    }
    return newLastTimestamp
  }

  toHistoryItemDto(historyItem: HistoryItem): HistoryItemDto {
    const historyItemDto = new HistoryItemDto()
    historyItemDto.type = historyItem.type
    historyItemDto.data = historyItem.data
    historyItemDto.timestamp = historyItem.timestamp
    return historyItemDto
  }

  async getApprovalHistory(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    timestamp: Date,
    amount: number,
    direction: 'before' | 'after'
  ): Promise<HistoryItem[]> {
    const approvalAudits = await this.approvalAuditService.list(
      namespaceId,
      releaseId,
      timestamp,
      amount + LOOKAHEAD_AMOUNT,
      direction,
      queryRunner.manager
    )
    const historyItems: HistoryItem[] = []
    await Promise.all(
      approvalAudits.map(async (audit) => {
        const historyItem = await this.approvalAuditToHistoryItem(audit)
        if (historyItem) {
          historyItems.push(historyItem)
        }
      })
    )
    return historyItems
  }

  async approvalAuditToHistoryItem(
    audit: ApprovalAuditEntity
  ): Promise<HistoryItem | undefined> {
    const historyItem = new HistoryItem()
    const data = new ApprovalHistoryEventData()
    const original = audit.original as ApprovalEntity
    const modified = audit.modified as ApprovalEntity
    data.actor = await this.retrieveAuditActor(audit)
    switch (audit.action) {
      case 'create': {
        const approver = await this.retrieveApprover(modified.approver)
        historyItem.type = HistoryType.EVENT
        data.action = `added ${approver.displayName}`
        break
      }
      case 'update': {
        historyItem.type = HistoryType.EVENT
        if (
          original.approvalState === ApprovalState.PENDING &&
          modified.approvalState === ApprovalState.APPROVED
        ) {
          data.action = 'approved'
        } else if (
          original.approvalState === ApprovalState.APPROVED &&
          modified.approvalState === ApprovalState.PENDING
        ) {
          data.action = 'reset'
        } else {
          // No history relevant change detected
          return undefined
        }
        if (modified.comment) {
          data.comment = await this.commentService.toCommentWithRepliesDto(
            modified.comment
          )
        }
        break
      }
      case 'delete': {
        const approver = await this.retrieveApprover(original.approver)
        historyItem.type = HistoryType.EVENT
        data.action = `removed ${approver.displayName}`
        break
      }
    }
    historyItem.timestamp = audit.modificationTime
    historyItem.data = data
    return historyItem
  }

  async getOverrideHistory(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    timestamp: Date,
    amount: number,
    direction: 'before' | 'after'
  ): Promise<HistoryItem[]> {
    const overrideAudits = await this.overrideAuditService.list(
      namespaceId,
      releaseId,
      timestamp,
      amount + LOOKAHEAD_AMOUNT,
      direction,
      queryRunner.manager
    )
    const historyItems: HistoryItem[] = []
    await Promise.all(
      overrideAudits.map(async (audit) => {
        const historyItem = await this.overrideAuditToHistoryItem(
          queryRunner,
          namespaceId,
          releaseId,
          audit
        )
        if (historyItem) {
          historyItems.push(historyItem)
        }
      })
    )
    return historyItems
  }

  async overrideAuditToHistoryItem(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    audit: OverrideAuditEntity
  ): Promise<HistoryItem | undefined> {
    const actor = await this.retrieveAuditActor(audit)

    const historyItem = new HistoryItem()
    historyItem.type = HistoryType.EVENT
    historyItem.timestamp = audit.modificationTime

    const original = audit.original as OverrideEntity
    const modified = audit.modified as OverrideEntity

    switch (audit.action) {
      case Action.CREATE: {
        const data = new AddOverrideHistoryEventData()
        data.actor = actor

        data.action = `${data.actor.displayName} added override for check: "${modified.chapter}" "${modified.requirement}" "${modified.check}", new manual color: ${modified.manualColor}`

        data.reference = new CheckReference(
          modified.chapter,
          modified.requirement,
          modified.check
        )

        data.previousAutoColor = modified.originalColor
        data.newManualColor = modified.manualColor

        data.comment = modified.comment

        /*
         * workaround for backwards compatibility
         */
        if ((modified.comment as any).id !== undefined) {
          try {
            const entity = await this.commentService.getWithTransaction(
              queryRunner,
              namespaceId,
              releaseId,
              (modified.comment as any).id
            )
            data.comment = entity.content
          } catch (e) {
            data.comment = 'comment not available anymore'
          }
        }

        historyItem.data = data

        break
      }
      case Action.UPDATE: {
        const data = new UpdateOverrideHistoryEventData()

        data.actor = actor
        data.action = `${data.actor.displayName} updated override for check: "${original.chapter}" "${original.requirement}" "${original.check}", new manual color: ${modified.manualColor}`

        data.reference = new CheckReference(
          original.chapter,
          original.requirement,
          original.check
        )

        data.previousManualColor = original.manualColor
        data.newManualColor = modified.manualColor

        data.comment = modified.comment

        /*
         * workaround for backwards compatibility
         */
        if ((modified.comment as any).id !== undefined) {
          try {
            const entity = await this.commentService.getWithTransaction(
              queryRunner,
              namespaceId,
              releaseId,
              (modified.comment as any).id
            )
            data.comment = entity.content
          } catch (e) {
            data.comment = 'comment not available anymore'
          }
        }

        historyItem.data = data

        break
      }
      case Action.DELETE: {
        const data = new DeleteOverrideHistoryEventData()
        data.actor = actor
        data.action = `${data.actor.displayName} removed override for check: "${original.chapter}" "${original.requirement}" "${original.check}", old manual color: ${original.manualColor}`

        data.reference = new CheckReference(
          original.chapter,
          original.requirement,
          original.check
        )

        data.previousManualColor = original.manualColor

        historyItem.data = data

        break
      }
      default:
        return undefined
    }

    return historyItem
  }

  async getCommentHistory(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    timestamp: Date,
    amount: number,
    direction: 'before' | 'after',
    filter: HistoryFilter
  ): Promise<HistoryItem[]> {
    let comments = []
    switch (filter) {
      case HistoryFilter.RESOLVED:
        comments = await this.commentService.listCommentsByStatus(
          queryRunner,
          namespaceId,
          releaseId,
          CommentStatus.RESOLVED,
          timestamp,
          amount,
          direction
        )
        break
      case HistoryFilter.UNRESOLVED:
        comments = await this.commentService.listCommentsByStatus(
          queryRunner,
          namespaceId,
          releaseId,
          CommentStatus.CREATED,
          timestamp,
          amount,
          direction
        )
        break
      default:
        comments = await this.commentService.listComments(
          queryRunner,
          namespaceId,
          releaseId,
          timestamp,
          amount,
          direction
        )
        break
    }
    comments = comments.filter((comment: CommentEntity) => {
      return comment.referenceType !== ReferenceType.APPROVAL
    })

    const historyItems: HistoryItem[] = []
    await Promise.all(
      comments.map(async (comment) => {
        const historyItem = await this.commentToHistoryItem(comment)
        if (historyItem) {
          historyItems.push(historyItem)
        }
      })
    )
    return historyItems
  }

  async commentToHistoryItem(comment: CommentEntity): Promise<HistoryItem> {
    const historyItem = new HistoryItem()
    historyItem.type = HistoryType.COMMENT
    historyItem.timestamp = comment.creationTime
    historyItem.data =
      await this.commentService.toCommentWithRepliesAndReferenceDto(comment)
    return historyItem
  }

  async getReleaseAuditHistory(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    timestamp: Date,
    amount: number,
    direction: 'before' | 'after'
  ): Promise<HistoryItem[]> {
    const releaseAudits = await this.releaseAuditService.list(
      namespaceId,
      releaseId,
      timestamp,
      amount + LOOKAHEAD_AMOUNT,
      direction,
      queryRunner.manager
    )
    const historyItems: HistoryItem[] = []
    await Promise.all(
      releaseAudits.map(async (audit) => {
        const historyItem = await this.releaseAuditToHistoryItem(audit)
        if (historyItem) {
          historyItems.push(historyItem)
        }
      })
    )
    return historyItems
  }

  async releaseAuditToHistoryItem(
    audit: ReleaseAuditEntity
  ): Promise<HistoryItem | undefined> {
    const historyItem = new HistoryItem()
    const data = new HistoryEventData()
    const original = audit.original as ReleaseEntity
    const modified = audit.modified as ReleaseEntity
    data.actor = await this.retrieveAuditActor(audit)
    if (audit.action === 'update') {
      if (!original.closed && modified.closed) {
        data.action = 'closed'
      } else if (original.name !== modified.name) {
        data.action = 'updated name'
      } else if (original.plannedDate !== modified.plannedDate) {
        data.action = 'updated plannedDate'
      } else if (original.approvalMode !== modified.approvalMode) {
        data.action = 'updated approvalMode'
      } else if (original.approvalState !== modified.approvalState) {
        if (modified.approvalState === ApprovalState.PENDING) {
          data.action = 'release reset'
        } else if (modified.approvalState === ApprovalState.APPROVED) {
          data.action = 'release approved'
        }
      }
    } else {
      return undefined
    }
    if (!data.action) {
      return undefined
    }
    historyItem.type = HistoryType.EVENT
    historyItem.timestamp = audit.modificationTime
    historyItem.data = data
    return historyItem
  }

  async getRunAuditHistory(
    queryRunner: QueryRunner,
    namespaceId: number,
    release: ReleaseEntity,
    timestamp: Date,
    amount: number,
    direction: 'before' | 'after'
  ): Promise<HistoryItemDto[]> {
    if (!release.config.id) {
      throw new Error(
        `Implementation Error: Release with id ${release.id} has no config id`
      )
    }
    const runHistory = await this.runAuditService.list(
      namespaceId,
      release.config.id,
      timestamp,
      amount,
      direction,
      queryRunner.manager
    )
    const historyItems: HistoryItem[] = []
    await Promise.all(
      runHistory.map(async (audit) => {
        const historyItem = release.closed
          ? await this.runAuditToHistoryItem(
              audit,
              release.creationTime,
              release.lastModificationTime
            )
          : await this.runAuditToHistoryItem(audit, release.creationTime)
        if (historyItem) {
          historyItems.push(historyItem)
        }
      })
    )
    return historyItems
  }

  async runAuditToHistoryItem(
    audit: RunAuditEntity,
    createdTimestamp?: Date,
    closedTimestamp?: Date
  ): Promise<HistoryItem | undefined> {
    if (audit.action !== Action.UPDATE) {
      return undefined
    }
    if (
      audit.modificationTime > closedTimestamp ||
      audit.modificationTime < createdTimestamp
    ) {
      return undefined
    }
    const original = audit.original as Run
    const modified = audit.modified as Run
    const historyItem = new HistoryItem()
    const data = new HistoryEventData()
    data.actor = await this.retrieveAuditActor(audit)
    historyItem.type = HistoryType.EVENT
    historyItem.timestamp = audit.modificationTime

    const runCompletedEvent =
      modified.status != original.status &&
      modified.status === RunStatus.Completed
    if (!runCompletedEvent) {
      return undefined
    }

    switch (modified.overallResult) {
      case RunResult.Green:
      case RunResult.Yellow:
      case RunResult.Red:
        data.action = `run ${modified.id} succeeded with status ${modified.overallResult} and automatically resolved its findings`
        break
      case RunResult.Failed:
      case 'ERROR' as RunResult:
        data.action = `run ${modified.id} failed`
        break
    }

    if (!data.action) {
      return undefined
    }

    historyItem.data = data
    return historyItem
  }

  private async retrieveAuditActor(
    audit: AuditEntity
  ): Promise<UserInNamespaceDto> {
    // To ensure backwards compatibility with old audits we also need to allow the actor to contain the username only in the database
    if (!audit.actor) {
      throw new Error('Implementation Error: Actor not found in audit')
    }
    if (!audit.actor.id && audit.actor.username) {
      return await this.usersService.getUser(audit.actor.username)
    } else {
      return {
        ...audit.actor,
      } as UserInNamespaceDto
    }
  }

  private async retrieveApprover(
    approverId: string
  ): Promise<UserInNamespaceDto> {
    return this.usersService.getUser(approverId)
  }
}
