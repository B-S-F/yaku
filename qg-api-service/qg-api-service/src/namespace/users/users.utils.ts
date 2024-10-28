import {
  PaginatedData,
  PaginationQueryOptions,
  SortOrder,
} from '@B-S-F/api-commons-lib'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

export class UserInNamespaceDto {
  @ApiProperty({
    description: 'Id of the user in the namespace',
    example: 'f6ce7976-dd70-4afc-b58f-85bcd37ffae6',
  })
  id: string

  @ApiProperty({
    description: 'Username of the user',
    example: 'testuser',
  })
  username: string

  @ApiProperty({
    description: 'Email of the user',
    example: 'test@example.com',
  })
  email: string

  @ApiProperty({
    description: 'Display name of the user',
  })
  displayName: string

  @ApiProperty({
    description: 'First name of the user',
  })
  firstName: string

  @ApiProperty({
    description: 'Last name of the user',
  })
  lastName: string
}

export class UserInNamespaceListDto extends PaginatedData {
  @ApiProperty({
    description: 'Users with access to the namespace',
    type: UserInNamespaceDto,
    isArray: true,
  })
  data: UserInNamespaceDto[]
}

export type AllowedSortProperties = keyof UserInNamespaceDto
export const allowedSortProperties = ['displayName', 'username'] as const

export class UserInNamespaceQueryOptions extends PaginationQueryOptions {
  @ApiPropertyOptional({
    description: `Sort users in the namespace by the given property, allowed properties are ${allowedSortProperties}`,
    type: 'string',
    example: 'displayName',
    default: 'displayName',
  })
  sortBy?: keyof UserInNamespaceDto

  @ApiPropertyOptional({
    description:
      'Only return those users that contain the characters in the search term',
    type: 'string',
    example: '',
    default: '',
  })
  search?: string
}

export const queryOptionsSchema = z.object({
  page: z.number().int().positive().optional(),
  items: z.number().int().positive().optional(),
  sortOrder: z.nativeEnum(SortOrder).optional(),
  sortBy: z.enum(allowedSortProperties).optional(),
  search: z.string().trim().min(1).optional(),
})
