import { Module } from '@nestjs/common'
import { NotificationService } from './notification.service'
import { MailingModule } from '../mailing/mailing.module'
import { UserProfileModule } from '../user/user-profile/user-profile.module'
import { LocalKeyCloakModule } from '../keycloak/local.keycloak.module'

@Module({
  imports: [MailingModule.register(), UserProfileModule, LocalKeyCloakModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
