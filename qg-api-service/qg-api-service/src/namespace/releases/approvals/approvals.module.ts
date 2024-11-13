import {
  UrlHandlerFactory,
  UrlProtocolConfig,
} from '@B-S-F/api-commons-lib'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SERVICE_PROTOCOL } from '../../../config'
import { UsersModule } from '../../users/users.module'
import { CommentsModule } from '../comments/comments.module'
import { ReleaseAuditService } from '../release.entity'
import { ApprovalController } from './approvals.controller'
import {
  ApprovalAuditEntity,
  ApprovalAuditService,
  ApprovalEntity,
} from './approvals.entity'
import { ApprovalService } from './approvals.service'
import { SubscriptionModule } from '../../subscriptions/subscription.module'
import { NotificationModule } from 'src/notifications/notification.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ApprovalEntity, ApprovalAuditEntity]),
    UsersModule,
    CommentsModule,
    SubscriptionModule,
    NotificationModule,
  ],
  controllers: [ApprovalController],
  providers: [
    ApprovalService,
    UrlHandlerFactory,
    ApprovalAuditService,
    ReleaseAuditService,
    {
      provide: UrlProtocolConfig,
      useFactory: () => {
        return new UrlProtocolConfig(SERVICE_PROTOCOL)
      },
    },
  ],
  exports: [ApprovalService, ApprovalAuditService],
})
export class ApprovalsModule {}
