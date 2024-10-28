import { SortOrder } from '@B-S-F/api-commons-lib'
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger'
import { z } from 'zod'
import { UserInNamespaceDto } from '../users/users.utils'
import {
  CommentWithRepliesAndReferenceDto,
  CommentWithRepliesDto,
} from './comments/comments.utils'
import { CheckColor, CheckReference } from './overrides/overrides.utils'

export enum HistoryFilter {
  EVENT = 'event',
  RESOLVED = 'resolved',
  UNRESOLVED = 'unresolved',
}
export const allowedHistoryFilters = [
  HistoryFilter.EVENT,
  HistoryFilter.RESOLVED,
  HistoryFilter.UNRESOLVED,
] as const
export enum HistoryType {
  COMMENT = 'comment',
  EVENT = 'event',
}
export const allowedHistoryTypes = [
  HistoryType.COMMENT,
  HistoryType.EVENT,
] as const

export class HistoryEventData {
  @ApiProperty({
    description: 'The user who performed the action',
  })
  actor: UserInNamespaceDto
  @ApiProperty({
    description: 'The action that was performed',
  })
  action: string
}

export class ApprovalHistoryEventData extends HistoryEventData {
  comment: CommentWithRepliesDto
}

export class AddOverrideHistoryEventData extends HistoryEventData {
  comment: string
  reference: CheckReference
  previousAutoColor: CheckColor
  newManualColor: CheckColor
}

export class UpdateOverrideHistoryEventData extends HistoryEventData {
  comment: string
  reference: CheckReference
  previousManualColor: CheckColor
  newManualColor: CheckColor
}

export class DeleteOverrideHistoryEventData extends HistoryEventData {
  reference: CheckReference
  previousManualColor: CheckColor
}

@ApiExtraModels(
  CommentWithRepliesAndReferenceDto,
  HistoryEventData,
  ApprovalHistoryEventData,
  AddOverrideHistoryEventData,
  UpdateOverrideHistoryEventData,
  DeleteOverrideHistoryEventData
)
export class HistoryItemDto {
  @ApiProperty({
    enum: allowedHistoryTypes,
    description: 'The type of the history item',
  })
  type: HistoryType
  @ApiProperty({
    description: 'The data of the history item',
    oneOf: [
      { $ref: getSchemaPath(HistoryEventData) },
      { $ref: getSchemaPath(CommentWithRepliesAndReferenceDto) },
      { $ref: getSchemaPath(ApprovalHistoryEventData) },
      { $ref: getSchemaPath(AddOverrideHistoryEventData) },
      { $ref: getSchemaPath(UpdateOverrideHistoryEventData) },
      { $ref: getSchemaPath(DeleteOverrideHistoryEventData) },
    ],
  })
  data: HistoryEventData | CommentWithRepliesAndReferenceDto
  @ApiProperty({
    description: 'The timestamp of the history item',
  })
  timestamp: Date
}

export class HistoryItem extends HistoryItemDto {}

export class HistoryDtoLink {
  @ApiProperty({
    description: 'The link to the next page',
    example:
      'http://localhost:3000/namespace/releases/history?page=2&items=20?lastTimestamp=1715083078',
  })
  next?: string
}

export class HistoryDto {
  @ApiProperty({
    description: 'The history items',
    type: HistoryItemDto,
    isArray: true,
  })
  data: HistoryItemDto[]
  @ApiProperty({
    description: 'Links to surrounding pages',
    type: HistoryDtoLink,
  })
  links: HistoryDtoLink
}

export class PaginationMarkers {
  lastTimestamp?: number
}

export class HistoryQueryOptions extends PaginationMarkers {
  @ApiProperty({
    description: 'The sort order for the history items based on the timestamp',
    enum: SortOrder,
    required: false,
  })
  sortOrder?: SortOrder
  @ApiProperty({
    description: 'The filter for the history types',
    enum: allowedHistoryFilters,
    required: false,
  })
  filter?: HistoryFilter
  @ApiProperty({
    description: 'The amount of items on the page',
    required: false,
    default: 20,
    example: 20,
  })
  items?: number
}

export const historyQueryOptionsSchema = z.object({
  lastTimestamp: z.number().int().optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  filter: z.enum(allowedHistoryFilters).optional(),
  items: z.number().int().optional(),
})
