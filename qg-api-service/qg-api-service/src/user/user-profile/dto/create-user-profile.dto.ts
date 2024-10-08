import { EditorType } from '../utils/types'

export class CreateUserProfileDto {
  emailNotifications?: boolean
  editor?: EditorType
}
