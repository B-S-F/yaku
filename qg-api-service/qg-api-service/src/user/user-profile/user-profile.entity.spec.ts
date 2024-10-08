import { UserProfile } from './user-profile.entity'
import { EditorType } from './utils/types'

describe('UserProfile', () => {
  it('should create an user profile', () => {
    const userProfile: UserProfile = new UserProfile()
    userProfile.id = 'some-uuid'
    userProfile.emailNotifications = true
    userProfile.editor = EditorType.CODE

    const expected: UserProfile = {
      id: 'some-uuid',
      emailNotifications: true,
      editor: EditorType.CODE,
    }

    expect(userProfile).toBeDefined()
    expect(userProfile.id).toBe(expected.id)
    expect(userProfile.emailNotifications).toBe(expected.emailNotifications)
  })
})
