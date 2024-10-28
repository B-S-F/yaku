import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { LongRunningTokenEntity, STATUS } from './long.running.token.entity'
import { PaginatedData } from '@B-S-F/api-commons-lib'
import { z } from 'zod'

export const allowedSortProperties = [
  'id',
  'status',
  'creationTime',
  'lastModificationTime',
]

export class GetTokenResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the token',
    example: '35',
  })
  id: number

  @ApiProperty({
    description: 'Description of the token',
    example: 'Token for the Jenkins automation',
  })
  description: string

  @ApiProperty({
    description: 'Operations with the token try to execute as admin',
    example: 'true',
  })
  try_admin: boolean

  @ApiProperty({
    description: 'Status of the token',
    example: 'revoked',
  })
  status: STATUS

  @ApiProperty({
    description: 'User that created the token',
    example: 'ugh2fe4@bosch.com',
  })
  createdBy: string

  @ApiProperty({
    description: 'User that modified the token most recently',
    example: 'ugh2fe4@bosch.com',
  })
  lastModifiedBy: string

  @ApiProperty({
    description:
      'Creation date of the token (ISO 8601 without timezone offsets)',
    example: '2024-03-25T15:40:27.026Z',
  })
  creationTime: Date

  @ApiProperty({
    description:
      'Date and time of the last modification of the token (ISO 8601 without timezone offsets)',
    example: '2024-03-25T15:40:27.026Z',
  })
  lastModificationTime: Date
}

export class CreateTokenResponseDto extends GetTokenResponseDto {
  @ApiProperty({
    description: 'Token for future authentication',
    example: 'yakp_aa_000000035_5d347a238ac2f4140eca9256465f1a',
  })
  token: string
}

export class TokenListDto extends PaginatedData {
  @ApiProperty({
    description: 'List of meta data about tokens',
    type: GetTokenResponseDto,
    isArray: true,
  })
  data: GetTokenResponseDto[]
}

export const MAX_TOKEN_DESCRIPTION_LEN = 1000

export const createTokenRequestDtoSchema = z
  .object({
    description: z.string().trim().min(1).max(MAX_TOKEN_DESCRIPTION_LEN),
    try_admin: z.boolean().optional(),
  })
  .strict()

export class CreateTokenRequestDto {
  @ApiProperty({
    description: `Description of the token, max ${MAX_TOKEN_DESCRIPTION_LEN} characters`,
    example: 'Token for the Jenkins automation',
  })
  description: string

  @ApiPropertyOptional({
    description:
      'Operations with the token try to execute as admin. You do not need this for regular operations.',
    example: 'false',
    default: false,
  })
  try_admin?: boolean | undefined
}

export function toCreateTokenResponseDto(
  entity: LongRunningTokenEntity,
  token: string
): CreateTokenResponseDto {
  const dto = new CreateTokenResponseDto()

  dto.id = entity.id
  dto.description = entity.description
  dto.try_admin = entity.try_admin
  dto.createdBy = entity.createdBy
  dto.creationTime = entity.creationTime
  dto.lastModifiedBy = entity.lastModifiedBy
  dto.lastModificationTime = entity.lastModificationTime
  dto.status = entity.status
  dto.token = token

  return dto
}

export function toGetTokenResponseDto(
  entity: LongRunningTokenEntity
): GetTokenResponseDto {
  const dto = new GetTokenResponseDto()

  dto.id = entity.id
  dto.description = entity.description
  dto.try_admin = entity.try_admin
  dto.createdBy = entity.createdBy
  dto.creationTime = entity.creationTime
  dto.lastModifiedBy = entity.lastModifiedBy
  dto.lastModificationTime = entity.lastModificationTime
  dto.status = entity.status

  return dto
}
