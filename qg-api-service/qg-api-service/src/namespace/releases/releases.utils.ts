import { PaginatedData } from '@B-S-F/api-commons-lib'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { UserInNamespaceDto } from '../users/users.utils'
import { ApprovalState } from './approvals/approvals.util'
import { ApprovalMode, approvalModes } from './release.entity'

export const allowedSortProperties = ['id']
export const MAX_NAME_LENGTH = 256

export class ReleaseDto {
  @ApiProperty({
    description: 'Service internal id of the release',
    example: '3',
  })
  id: number

  @ApiProperty({
    description: 'Name of the release',
    example: 'QG4.2 Battery Management BatMax',
  })
  name: string

  @ApiProperty({
    description: 'Approval mode of the release',
    example: 'all',
  })
  approvalMode: ApprovalMode

  @ApiProperty({
    description: 'Approval state of the release',
    example: 'pending',
  })
  approvalState: ApprovalState

  @ApiProperty({
    description: 'Service internal id of the qg config',
    example: '4',
  })
  qgConfigId: number

  createdBy: UserInNamespaceDto
  lastModifiedBy: UserInNamespaceDto

  @ApiProperty({
    description: 'Planned release date (ISO 8601 without timezone offsets)',
    example: '2024-03-25T15:40:27.026Z',
  })
  plannedDate: Date

  @ApiProperty({
    description:
      'Creation date of the release (ISO 8601 without timezone offsets)',
    example: '2024-03-25T15:40:27.026Z',
  })
  creationTime: Date

  @ApiProperty({
    description:
      'Date and time of the last modification of the release (ISO 8601 without timezone offsets)',
    example: '2024-03-25T15:40:27.026Z',
  })
  lastModificationTime: Date

  @ApiProperty({
    description:
      'Whether this release is closed, i.e. no further actions are possible',
    example: 'false',
  })
  closed: boolean

  @ApiProperty({
    description:
      'Id of the last run that was executed for this release, if any',
    example: '1',
  })
  lastRunId: number | null
}

export class ReleaseListDto extends PaginatedData {
  @ApiProperty({
    description: 'List of releases',
    type: ReleaseDto,
    isArray: true,
  })
  data: ReleaseDto[]
}

export class AddReleaseDto {
  @ApiProperty({
    description: `Name of the release (max ${MAX_NAME_LENGTH} characters)`,
    example: 'QG4.2 Battery Management BatMax',
  })
  name: string

  @ApiProperty({
    description: 'Approval mode for the release',
    example: 'one',
  })
  approvalMode: ApprovalMode

  @ApiProperty({
    description: 'QG config id to link this release with',
    example: '2',
  })
  qgConfigId: number

  @ApiProperty({
    description: 'Planned release date (ISO 8601 without timezone offsets)',
    example: '2024-03-25T13:32:07.749Z',
  })
  plannedDate: Date
}

export const addReleaseDtoSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
    approvalMode: z.enum(approvalModes),
    qgConfigId: z.number().int().positive(),
    plannedDate: z.string().datetime(),
  })
  .strict()

export class UpdateReleaseDto {
  @ApiPropertyOptional({
    description: `Name of the release (max ${MAX_NAME_LENGTH} characters)`,
    example: 'QG4.2 Battery Management BatMax',
  })
  name?: string

  @ApiPropertyOptional({
    description: 'Approval mode for the release',
    example: 'one',
  })
  approvalMode?: ApprovalMode

  @ApiPropertyOptional({
    description: 'Planned release date (ISO 8601 without timezone offsets)',
    example: '2024-03-25T13:32:07.749Z',
  })
  plannedDate?: Date
}

export const updateReleaseDtoSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_NAME_LENGTH).optional(),
    approvalMode: z.enum(approvalModes).optional(),
    plannedDate: z.string().datetime().optional(),
  })
  .strict()
  .refine((val) => {
    return (
      val.name != undefined ||
      val.approvalMode != undefined ||
      val.plannedDate != undefined
    )
  }, 'At least one field must be provided')

export class AggregateApprovalDto {
  @ApiProperty({
    description: "Aggregate state of the release's approval",
    example: 'approved',
  })
  state: ApprovalState
}
