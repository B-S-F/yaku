import {
  PaginatedData,
  PaginationQueryOptions,
} from '@B-S-F/api-commons-lib'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { UserInNamespaceDto } from '../../../namespace/users/users.utils'
export const allowedSortProperties = [
  'id',
  'creationTime',
  'lastModificationTime',
]
export enum ReferenceType {
  CHECK = 'check',
  COMMENT = 'comment',
  RELEASE = 'release',
  APPROVAL = 'approval',
}

export const referenceTypes = [
  ReferenceType.CHECK,
  ReferenceType.COMMENT,
  ReferenceType.RELEASE,
  ReferenceType.APPROVAL,
]

export const mentionsDelimiter = /@(\w+@\w+\.\w+)/g

export class CommentsQueryOptions extends PaginationQueryOptions {
  @ApiPropertyOptional({
    description: `Sort comments by the given property, allowed properties are ${allowedSortProperties}`,
    type: 'string',
    example: 'creationTime',
    default: 'creationTime',
  })
  sortBy?: string
}

export class CommentsByReferenceQueryOptions {
  @ApiPropertyOptional({
    description: `Sort top level comments in the given order, allowed values are 'ASC' and 'DESC'`,
    type: 'string',
    example: 'ASC',
    default: 'ASC',
  })
  sortOrder?: string
}

export class Reference {
  type: ReferenceType
  chapter?: string
  requirement?: string
  check?: string
  id?: number
}

export const referenceSchema = z.union([
  z.object({
    type: z.literal('check'),
    chapter: z.string().trim().min(1),
    requirement: z.string().trim().min(1),
    check: z.string().trim().min(1),
  }),
  z.object({
    type: z.literal('comment'),
    id: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('release'),
  }),
])

export const ReferenceApiProperty = [
  {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['check'] },
      chapter: { type: 'string' },
      requirement: { type: 'string' },
      check: { type: 'string' },
    },
    required: ['type', 'chapter', 'requirement', 'check'],
  },
  {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['comment'] },
      id: { type: 'number' },
    },
    required: ['type', 'id'],
  },
  {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['release'] },
    },
    required: ['type'],
  },
]

export class CommentDto {
  @ApiProperty({
    description: 'id of the comment',
    example: 1,
  })
  id: number
  @ApiProperty({
    description: 'reference of the comment', // TODO: describe better
    example: { type: 'check', chapter: '1', requirement: '1', check: '1' },
    oneOf: ReferenceApiProperty,
  })
  reference: Reference
  @ApiProperty({
    description: 'content of the comment',
    example: 'Lorem Ipsum',
  })
  content: string
  @ApiProperty({
    description: 'denotes if a comment is a todo or just informational',
    example: true,
  })
  todo: boolean
  @ApiProperty({
    description: 'status of the comment, can be created or resolved',
    example: 'created',
  })
  status: string
  createdBy: UserInNamespaceDto
  @ApiProperty({
    description: 'timestamp of the creation of the comment',
    example: '2021-09-09T14:00:00Z',
  })
  creationTime: Date
  lastModifiedBy: UserInNamespaceDto
  @ApiProperty({
    description: 'timestamp of the last modification',
    example: '2021-09-09T14:00:00Z',
  })
  lastModificationTime: Date
}

export const addCommentDtoSchema = z.object({
  reference: referenceSchema,
  content: z.string().trim().min(1),
  todo: z.boolean(),
})

export class AddCommentDto {
  @ApiPropertyOptional({
    description: 'reference of the comment', // TODO: describe better
    example: { type: 'check', chapter: '1', requirement: '1', check: '1' },
    oneOf: ReferenceApiProperty,
  })
  reference: Reference
  @ApiProperty({
    description: 'content of the comment',
    example: 'Lorem Ipsum',
  })
  content: string
  @ApiProperty({
    description: 'denotes if a comment is a todo or just informational',
    example: true,
  })
  todo: boolean
}

export const updateCommentDtoSchema = z.object({
  content: z.string().trim().min(1),
})

export class UpdateCommentDto {
  @ApiProperty({
    description: 'content of the comment',
    example: 'Lorem Ipsum',
  })
  content: string
}

export class ReplyDto {
  @ApiProperty({
    description: 'id of the comment',
    example: 1,
  })
  id: number
  @ApiProperty({
    description: 'content of the comment',
    example: 'Lorem Ipsum',
  })
  content: string
  @ApiProperty({
    description: 'denotes if a comment is a todo or just informational',
    example: true,
  })
  todo: boolean
  @ApiProperty({
    description: 'status of the comment, can be created or resolved',
    example: 'created',
  })
  status: string
  createdBy: UserInNamespaceDto
  @ApiProperty({
    description: 'timestamp of the creation of the comment',
    example: '2021-09-09T14:00:00Z',
  })
  creationTime: Date
  lastModifiedBy: UserInNamespaceDto
  @ApiProperty({
    description: 'timestamp of the last modification',
    example: '2021-09-09T14:00:00Z',
  })
  lastModificationTime: Date
}

export class CommentWithRepliesDto extends ReplyDto {
  @ApiProperty({
    description: 'List of replies to the comment',
    type: ReplyDto,
    isArray: true,
  })
  replies: ReplyDto[]
}

export class CommentWithRepliesAndReferenceDto extends CommentWithRepliesDto {
  @ApiProperty({
    description: 'reference of the comment', // TODO: describe better
    example: { type: 'check', chapter: '1', requirement: '1', check: '1' },
    oneOf: ReferenceApiProperty,
  })
  reference: Reference
}

export class CommentsByReferenceDto {
  @ApiProperty({
    description: 'Contains the reference that was used to query the comments',
    example: { type: 'check', chapter: '1', requirement: '1', check: '1' },
    oneOf: ReferenceApiProperty,
  })
  root: Reference
  @ApiProperty({
    description: 'List of comments',
    type: CommentWithRepliesDto,
    isArray: true,
  })
  comments: CommentWithRepliesDto[]
}

export class CommentByReferenceListDto extends PaginatedData {
  @ApiProperty({
    description: 'List of comments by reference',
    type: CommentWithRepliesDto,
    isArray: true,
  })
  data: CommentsByReferenceDto[]
}
