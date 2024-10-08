import { ApiProperty } from '@nestjs/swagger'
import { UserProfile } from '../user-profile.entity'
import { EditorType } from '../utils/types'

export class GetUserProfileDto {
  constructor(userProfile: UserProfile) {
    this.id = userProfile.id
    this.emailNotifications = userProfile.emailNotifications
    this.editor = userProfile.editor
  }

  @ApiProperty({
    description: 'Keycloak id of the user',
    example: '0c8a2662-3a96-4196-b533-763db114ad73',
  })
  id: string

  @ApiProperty({
    description: 'Flag for email notifications',
    example: false,
  })
  emailNotifications: boolean

  @ApiProperty({
    description: 'The preferred editor',
    example: EditorType.CODE,
  })
  editor: EditorType
}
