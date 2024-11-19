// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ApiProperty } from '@nestjs/swagger'
import { EditorType } from '../utils/types'

export class UpdateUserProfileDto {
  @ApiProperty({
    description: 'Flag for email notifications',
    example: true,
  })
  emailNotifications?: boolean

  @ApiProperty({
    description: 'The preferred editor',
    example: EditorType.CODE,
  })
  editor?: EditorType
}
