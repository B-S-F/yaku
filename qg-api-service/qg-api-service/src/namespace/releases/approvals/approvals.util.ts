// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { PaginatedData } from '@B-S-F/api-commons-lib'
import { ApiProperty } from '@nestjs/swagger'
import { UserInNamespaceDto } from '../../../namespace/users/users.utils'
import { z } from 'zod'

export class AddApproverDto {
  @ApiProperty({
    description: 'User id of the user to be added as an approver',
    example: '221609bd-f023-406d-a9b8-7b15709758b9',
  })
  user: string
}
export const addApproverDtoSchema = z
  .object({
    user: z.string().trim().uuid(),
  })
  .strict()

export class UpdateApprovalDto {
  @ApiProperty({
    description: 'Comment for the approval',
    example: 'All open conversations have been resolved.',
  })
  comment: string
}

export const updateApprovalDtoSchema = z
  .object({
    comment: z.string().trim().min(1),
  })
  .strict()

export class ApprovalDto {
  @ApiProperty({
    description: 'Release specific id of the approver',
    example: '1',
  })
  id: number

  @ApiProperty({
    description: 'Approver details from namespace',
  })
  user: UserInNamespaceDto

  @ApiProperty({
    description: 'State of the approval',
    example: 'pending',
  })
  state: ApprovalState
}

export const allowedSortPropertiesApprovalList = ['id']

export class ApprovalListDto extends PaginatedData {
  @ApiProperty({
    description: 'List of approvals',
    type: ApprovalDto,
    isArray: true,
  })
  data: ApprovalDto[]
}

export enum ApprovalState {
  APPROVED = 'approved',
  PENDING = 'pending',
}
export const approvalStates = [
  ApprovalState.APPROVED,
  ApprovalState.PENDING,
] as const

export const APPROVER_UNIQUE_PER_RELEASE_CONSTRAINT =
  'same_person_may_not_be_an_approver_multiple_times'
