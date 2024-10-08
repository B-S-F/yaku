import { Test } from '@nestjs/testing'
import { Logger, LoggerModule, PinoLogger } from 'nestjs-pino'
import {
  KeyCloakService,
  KeyCloakUserOfRole,
} from '@B-S-F/api-keycloak-auth-lib'
import { DELETED_USER, SYSTEM_USER } from '../namespace/users/users.service'
import { LocalKeyCloakModule } from '../keycloak/local.keycloak.module'
import { MailingService, NullMailingService } from '../mailing/mailing.service'
import { UserProfileService } from '../user/user-profile/user-profile.service'
import { GetUserProfileDto } from '../user/user-profile/dto/get-user-profile.dto'

import { NotificationService } from './notification.service'

describe('NotificationService', () => {
  let service: NotificationService
  let keycloakService: KeyCloakService
  let mailingService: MailingService
  let userProfileService: UserProfileService

  let user: KeyCloakUserOfRole

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({}), LocalKeyCloakModule],
      providers: [
        {
          provide: PinoLogger,
          useValue: { pinoHttp: jest.fn() },
        },
        {
          provide: Logger,
          useValue: { info: jest.fn(), warn: jest.fn() },
        },
        {
          provide: UserProfileService,
          useValue: {
            get: jest.fn(),
          },
        },
        NotificationService,
        {
          provide: MailingService,
          useClass: NullMailingService,
        },
      ],
    }).compile()

    service = module.get<NotificationService>(NotificationService)
    keycloakService = module.get<KeyCloakService>(KeyCloakService)
    mailingService = module.get<MailingService>(MailingService)
    userProfileService = module.get<UserProfileService>(UserProfileService)

    user = {
      kc_id: '5df83ff6-114a-4c83-b800-0ad9f87267d6',
      username: 'user@bosch.com',
      email: 'user@bosch.com',
      displayName: 'Test User',
      firstName: 'Test',
      lastName: 'User',
    }
  })

  afterEach(() => jest.restoreAllMocks())

  it('it should push notification to mailing service', async () => {
    jest
      .spyOn(keycloakService, 'getUserById')
      .mockResolvedValue(user as KeyCloakUserOfRole)
    jest.spyOn(userProfileService, 'get').mockResolvedValue({
      id: user.kc_id,
      emailNotifications: true,
      editor: 'code',
    } as GetUserProfileDto)
    const mailServiceSpy = jest.spyOn(mailingService, 'pushNotification')

    await service.pushNotification(user.kc_id, 'Unit test notification', {
      should: 'push',
      when: 'emailNotification on',
    } as any)

    expect(mailServiceSpy).toHaveBeenCalledWith(
      user.email,
      'Unit test notification',
      {
        should: 'push',
        when: 'emailNotification on',
      } as any
    )
  })

  it('should NOT push notification to mailing service when user emailNotification is off', async () => {
    jest.spyOn(keycloakService, 'getUserById').mockResolvedValue(user)
    jest.spyOn(userProfileService, 'get').mockResolvedValue({
      id: user.kc_id,
      emailNotifications: false,
      editor: 'code',
    } as GetUserProfileDto)
    const mailServiceSpy = jest.spyOn(mailingService, 'pushNotification')

    await service.pushNotification(user.kc_id, 'Unit test notification', {
      should: 'NOT push',
      when: 'emailNotification off',
    } as any)

    expect(mailServiceSpy).not.toHaveBeenCalled()
  })

  it.each([SYSTEM_USER, DELETED_USER])(
    'should skip when special user is detected',
    async (specialUser) => {
      const mailServiceSpy = jest.spyOn(mailingService, 'pushNotification')

      await service.pushNotification(specialUser.id, 'Unit test notification', {
        should: 'skip',
        when: 'special user detected',
      } as any)

      expect(mailServiceSpy).not.toHaveBeenCalled()
    }
  )

  it.each([' ', undefined])(
    'should skip when user has no or empty email',
    async (email) => {
      user.email = email
      jest
        .spyOn(keycloakService, 'getUserById')
        .mockResolvedValue(
          user as Omit<KeyCloakUserOfRole, 'email'> as KeyCloakUserOfRole
        )
      jest.spyOn(userProfileService, 'get').mockResolvedValue({
        id: user.kc_id,
        emailNotifications: true,
        editor: 'code',
      } as GetUserProfileDto)
      const mailServiceSpy = jest.spyOn(mailingService, 'pushNotification')

      await service.pushNotification(user.kc_id, 'Unit test notification', {
        some: 'data',
      } as any)

      expect(mailServiceSpy).not.toHaveBeenCalled()
    }
  )
})
