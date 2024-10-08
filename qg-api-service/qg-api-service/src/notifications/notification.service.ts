import { Inject, Injectable } from '@nestjs/common'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { KeyCloakService } from '@B-S-F/api-keycloak-auth-lib'
import { QG_LOG_LEVEL } from '../config'
import { Notification } from '../mailing/mailing.utils'
import { MailingService } from '../mailing/mailing.service'
import { UserProfileService } from '../user/user-profile/user-profile.service'
import { DELETED_USER, SYSTEM_USER } from '../namespace/users/users.service'

@Injectable()
export class NotificationService {
  @InjectPinoLogger(NotificationService.name)
  private readonly logger = new PinoLogger({
    pinoHttp: {
      level: QG_LOG_LEVEL,
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    },
  })

  constructor(
    @Inject(KeyCloakService) private readonly keycloakService: KeyCloakService,
    @Inject(MailingService) private readonly mailService: MailingService,
    @Inject(UserProfileService)
    private readonly userProfileService: UserProfileService
  ) {}

  async pushNotification(
    userId: string,
    title: string,
    notification: Notification
  ): Promise<void> {
    if (userId === DELETED_USER.id || userId === SYSTEM_USER.id) {
      this.logger.info(`Special user with id ${userId} detected, skipping`)
      return
    }

    const user = await this.keycloakService.getUserById(userId)
    if (!user.email || user.email.trim() === '') {
      this.logger.warn(`User with id ${user.kc_id} has no email, skipping`)
      return
    }
    const userProfile = await this.userProfileService.get(user.kc_id)
    if (userProfile.emailNotifications) {
      this.mailService.pushNotification(user.email, `${title}`, notification)
    }
  }
}
