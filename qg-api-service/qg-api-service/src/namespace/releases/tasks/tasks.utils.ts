import {
  PaginatedData,
  PaginationQueryOptions,
  SortOrder,
  UrlHandler,
} from '@B-S-F/api-commons-lib'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { UserInNamespaceDto } from '../../../namespace/users/users.utils'
import { ReminderMode, reminderModes } from './tasks.entity'

export type Reference = {
  chapter?: string
  requirement?: string
  check?: string
}

export class TaskDto {
  @ApiProperty({
    description: 'Id of the task',
    example: 1,
  })
  id: number

  @ApiPropertyOptional({
    description: 'Reference to the task',
    example: { chapter: '1', requirement: '1', check: '1' },
  })
  reference?: Reference

  @ApiProperty({
    description: 'Title of the task',
    example: 'Update the project documentation',
  })
  title: string

  @ApiProperty({
    description: 'Due date of the task (ISO 8601 without timezone offsets)',
    example: '2024-03-25T13:32:07.749Z',
  })
  dueDate: Date

  @ApiProperty({
    description: 'Reminder mode for the task',
    example: ReminderMode.OVERDUE,
  })
  reminder: ReminderMode

  @ApiProperty({
    description: 'Description of the task',
    example: 'Checkout the repository and update the documentation',
  })
  description: string

  @ApiProperty({
    description: 'Creator of the task',
    type: UserInNamespaceDto,
  })
  createdBy: UserInNamespaceDto
  @ApiProperty({
    description: 'Modifier of the task',
    type: UserInNamespaceDto,
  })
  lastModifiedBy: UserInNamespaceDto

  @ApiProperty({
    description: 'Time of creation',
    example: '2024-03-25T13:32:07.749Z',
  })
  creationTime: Date

  @ApiProperty({
    description: 'Time of last modification',
    example: '2024-03-25T13:32:07.749Z',
  })
  lastModificationTime: Date

  @ApiProperty({
    description: 'Whether the task is closed',
    example: false,
  })
  closed: boolean

  @ApiProperty({
    description: 'List of assignees',
    type: UserInNamespaceDto,
    isArray: true,
  })
  assignees: UserInNamespaceDto[]
}

export class TaskListDto extends PaginatedData {
  @ApiProperty({
    description: 'List of tasks',
    type: TaskDto,
    isArray: true,
  })
  data: TaskDto[]
}

export function createPaginationData(
  queryOptions: TaskQueryOptions,
  requestUrl: UrlHandler,
  totalItemCount: number,
  data: TaskDto[]
): TaskListDto {
  const dataItems = data ?? []
  const totalItems = totalItemCount > 0 ? totalItemCount : data.length
  const calcPage = totalItemCount > 0 ? queryOptions.page : 1
  return {
    pagination: {
      pageNumber: calcPage,
      pageSize: dataItems.length,
      totalCount: totalItems,
    },
    data: dataItems,
    links: createLinksSection(
      requestUrl,
      calcPage,
      queryOptions.items,
      totalItems,
      queryOptions.sortOrder,
      queryOptions.sortBy,
      queryOptions.state,
      queryOptions.assignees
    ),
  }
}

function createLinksSection(
  requestUrl: UrlHandler,
  pageNumber: number,
  itemCountPerPage: number,
  totalItemCount: number,
  sortOrder: SortOrder,
  sortBy: SortBy,
  state: TaskState,
  assignees: string[]
) {
  const maxPages = Math.max(Math.ceil(totalItemCount / itemCountPerPage), 1)
  let afterPage = `&items=${itemCountPerPage}`
  if (sortOrder) {
    afterPage = `${afterPage}&sortOrder=${sortOrder}`
  }
  if (sortBy) {
    afterPage = `${afterPage}&sortBy=${sortBy}`
  }
  if (state) {
    afterPage = `${afterPage}&state=${state}`
  }
  if (assignees) {
    for (const assignee of assignees) {
      afterPage = `${afterPage}&assignees=${assignee}`
    }
  }
  const links = {
    first: requestUrl.url(`?page=1${afterPage}`),
    last: requestUrl.url(`?page=${maxPages}${afterPage}`),
  }
  if (pageNumber > 1) {
    links['prev'] = requestUrl.url(`?page=${pageNumber - 1}${afterPage}`)
  }
  if (pageNumber < maxPages) {
    links['next'] = requestUrl.url(`?page=${pageNumber + 1}${afterPage}`)
  }
  return links
}

export enum TaskState {
  OPEN = 'open',
  CLOSED = 'closed',
}

export const allowedStates = [TaskState.OPEN, TaskState.CLOSED] as const

export enum SortBy {
  DUE_DATE = 'dueDate',
  CREATION_TIME = 'creationTime',
  LAST_MODIFICATION_TIME = 'lastModificationTime',
}

export const allowedSortPropertiesTaskList = [
  SortBy.DUE_DATE,
  SortBy.CREATION_TIME,
  SortBy.LAST_MODIFICATION_TIME,
] as const

export class TaskQueryOptions extends PaginationQueryOptions {
  @ApiPropertyOptional({
    description: 'Sorting order',
    enum: SortOrder,
    default: 'ASC',
    example: 'ASC',
    required: false,
  })
  sortOrder?: SortOrder

  @ApiPropertyOptional({
    description: 'Sorting by the given field',
    enum: SortBy,
    default: SortBy.DUE_DATE,
    example: SortBy.DUE_DATE,
    required: false,
  })
  sortBy?: SortBy

  @ApiPropertyOptional({
    description: 'Filtering by task states',
    enum: allowedStates,
    example: TaskState.OPEN,
    required: false,
  })
  state?: TaskState

  @ApiPropertyOptional({
    description: 'Filtering by assignees',
    isArray: true,
    required: false,
  })
  assignees?: string[]

  @ApiPropertyOptional({
    description: 'The amount of items on the page',
    required: false,
    default: 20,
    example: 20,
  })
  items?: number
}

export const taskQueryOptionsSchema = z
  .object({
    page: z.number().int().min(1).default(1).optional(),
    items: z.number().int().min(1).default(20).optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('ASC').optional(),
    sortBy: z
      .enum(allowedSortPropertiesTaskList)
      .default(SortBy.DUE_DATE)
      .optional(),
    state: z.enum(allowedStates).optional(),
    assignees: z.array(z.string().trim().min(1)).optional(),
  })
  .strict()

export class AddTaskDto {
  @ApiProperty({
    description: 'Title of the task',
    example: 'Update the project documentation',
  })
  title: string

  @ApiPropertyOptional({
    description: 'Due date of the task (ISO 8601 without timezone offsets)',
    example: '2024-03-25T13:32:07.749Z',
  })
  dueDate: Date

  @ApiPropertyOptional({
    description: 'Reminder mode for the task',
    example: 'overdue',
    enum: ['disabled', 'overdue', 'always'],
  })
  reminder?: ReminderMode

  @ApiPropertyOptional({
    description: 'Description of the task',
    example: 'Checkout the repository and update the documentation',
  })
  description: string
}

export const addTaskDtoSchema = z
  .object({
    title: z.string().trim().min(1),
    dueDate: z.string().datetime().optional(),
    reminder: z.enum(reminderModes).default(ReminderMode.DISABLED),
    description: z.string().trim().min(1).optional(),
  })
  .strict()

export class AddReferenceTaskDto {
  @ApiProperty({
    description: 'Reference to the task',
    example: { chapter: '1', requirement: '1', check: '1' },
  })
  reference: Reference

  @ApiPropertyOptional({
    description: 'Due date of the task (ISO 8601 without timezone offsets)',
    example: '2024-03-25T13:32:07.749Z',
  })
  dueDate: Date

  @ApiPropertyOptional({
    description: 'Reminder mode for the task',
    example: 'overdue',
    enum: ['disabled', 'overdue', 'always'],
  })
  reminder?: ReminderMode
}

export const addReferenceTaskDtoSchema = z
  .object({
    reference: z.object({
      chapter: z.string().trim().min(1).optional(),
      requirement: z.string().trim().min(1).optional(),
      check: z.string().trim().min(1).optional(),
    }),
    dueDate: z.string().datetime().optional(),
    reminder: z.enum(reminderModes).default(ReminderMode.DISABLED).optional(),
  })
  .strict()
  .refine((val) => {
    return (
      (val.reference.chapter &&
        !val.reference.requirement &&
        !val.reference.check) ||
      (val.reference.chapter &&
        val.reference.requirement &&
        !val.reference.check) ||
      (val.reference.chapter &&
        val.reference.requirement &&
        val.reference.check)
    )
  })

export class UpdateTaskDto {
  @ApiPropertyOptional({
    description: 'Title of the task',
    example: 'Update the project documentation',
    required: false,
  })
  title?: string

  @ApiPropertyOptional({
    description: 'Due date of the task (ISO 8601 without timezone offsets)',
    example: '2024-03-25T13:32:07.749Z',
    required: false,
  })
  dueDate?: Date

  @ApiPropertyOptional({
    description: 'Reminder mode for the task',
    example: 'overdue',
    enum: ['disabled', 'overdue', 'always'],
    required: false,
  })
  reminder?: ReminderMode

  @ApiPropertyOptional({
    description: 'Description of the task',
    example: 'Checkout the repository and update the documentation',
    required: false,
  })
  description?: string
}

export const updateTaskDtoSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    dueDate: z.string().datetime().optional(),
    reminder: z.enum(reminderModes).optional(),
    description: z.string().trim().min(1).optional(),
  })
  .strict()
  .refine((val) => {
    return (
      val.title !== undefined ||
      val.dueDate !== undefined ||
      val.reminder !== undefined ||
      val.description !== undefined
    )
  }, 'At least one field must be provided')

export class AddRemoveAssigneesDto {
  @ApiProperty({
    description: 'Username of the user to assign',
    example: '["user1", "user2"]',
    type: [String],
  })
  assignees: string[]
}

export const addRemoveAssigneesDtoSchema = z
  .object({
    assignees: z.array(z.string().trim().min(1)),
  })
  .strict()

export class AssigneesDto {
  @ApiProperty({
    description: 'List of assignees',
  })
  assignees: UserInNamespaceDto[]
}
