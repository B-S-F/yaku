import {
  UrlHandlerFactory,
  UrlProtocolConfig,
} from '@B-S-F/api-commons-lib'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SERVICE_PROTOCOL } from '../../config'
import { NotificationModule } from '../../notifications/notification.module'
import { Run, RunAuditService } from '../run/run.entity'
import { SubscriptionModule } from '../subscriptions/subscription.module'
import { UsersModule } from '../users/users.module'
import { ApprovalsModule } from './approvals/approvals.module'
import { CommentsModule } from './comments/comments.module'
import { HistoryService } from './history.service'
import { OverridesModule } from './overrides/overrides.module'
import {
  ReleaseAuditEntity,
  ReleaseAuditService,
  ReleaseEntity,
} from './release.entity'
import { ReleasesController } from './releases.controller'
import { ReleasesService } from './releases.service'
import { TaskModule } from './tasks/tasks.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ReleaseEntity, ReleaseAuditEntity, Run]),
    ApprovalsModule,
    CommentsModule,
    OverridesModule,
    UsersModule,
    SubscriptionModule,
    NotificationModule,
    TaskModule,
  ],
  controllers: [ReleasesController],
  providers: [
    ReleasesService,
    UrlHandlerFactory,
    HistoryService,
    ReleaseAuditService,
    RunAuditService,
    {
      provide: UrlProtocolConfig,
      useFactory: () => {
        return new UrlProtocolConfig(SERVICE_PROTOCOL)
      },
    },
  ],
})
export class ReleasesModule {}
