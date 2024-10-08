import { CreateUserProfileDto } from '../../dto/create-user-profile.dto'
import { GetUserProfileDto } from '../../dto/get-user-profile.dto'
import { UpdateUserProfileDto } from '../../dto/update-user-profile.dto'
import { UserProfile } from '../../user-profile.entity'
import { EditorType } from '../types'

export const userProfileDataFixtures: UserProfile[] = [
  {
    id: '0c8a2662-3a96-4196-b533-763db114ad73',
    emailNotifications: true,
    editor: EditorType.CODE,
  },
  {
    id: '1d8a2662-3a96-4196-b533-763db114ad73',
    emailNotifications: false,
    editor: EditorType.VISUAL,
  },
]

export const createUserProfileDTOFixtures: CreateUserProfileDto[] =
  userProfileDataFixtures.map((userProfile: UserProfile) => {
    const { id, ...createUserProfileDto } = userProfile
    return createUserProfileDto as CreateUserProfileDto
  })

export const getUserProfileDTOFixtures: GetUserProfileDto[] =
  userProfileDataFixtures.map((userProfile: UserProfile) => {
    return userProfile as GetUserProfileDto
  })

export const updateUserProfileDTOFixtures: UpdateUserProfileDto[] =
  userProfileDataFixtures.map((userProfile: UserProfile) => {
    const { id, ...updateUserProfileDto } = userProfile
    return updateUserProfileDto as UpdateUserProfileDto
  })
