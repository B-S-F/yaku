import {
  UrlHandlerFactory,
  UrlProtocolConfig,
} from '@B-S-F/api-commons-lib'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SERVICE_PROTOCOL } from '../../../config'
import { SubscriptionModule } from '../../../namespace/subscriptions/subscription.module'
import { UsersModule } from '../../../namespace/users/users.module'
import { NotificationModule } from '../../../notifications/notification.module'
import {
  OverrideAuditEntity,
  OverrideAuditService,
  OverrideEntity,
} from './override.entity'
import { OverridesController } from './overrides.controllers'
import { OverridesService } from './overrides.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([OverrideEntity, OverrideAuditEntity]),
    NotificationModule,
    SubscriptionModule,
    UsersModule,
  ],
  controllers: [OverridesController],
  providers: [
    OverridesService,
    UrlHandlerFactory,
    OverrideAuditService,
    {
      provide: UrlProtocolConfig,
      useFactory: () => {
        return new UrlProtocolConfig(SERVICE_PROTOCOL)
      },
    },
  ],
  exports: [OverridesService, OverrideAuditService],
})
export class OverridesModule {}
