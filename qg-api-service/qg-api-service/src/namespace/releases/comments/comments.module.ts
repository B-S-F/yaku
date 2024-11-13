import {
  UrlHandlerFactory,
  UrlProtocolConfig,
} from '@B-S-F/api-commons-lib'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SERVICE_PROTOCOL } from '../../../config'
import { UsersModule } from '../../../namespace/users/users.module'
import {
  CommentAuditEntity,
  CommentAuditService,
  CommentEntity,
} from './comment.entity'
import { CommentsController } from './comments.controller'
import { CommentsService } from './comments.service'
import { NotificationModule } from '../../../notifications/notification.module'
import { SubscriptionModule } from '../../subscriptions/subscription.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentEntity, CommentAuditEntity]),
    UsersModule,
    NotificationModule,
    SubscriptionModule,
  ],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    UrlHandlerFactory,
    CommentAuditService,
    {
      provide: UrlProtocolConfig,
      useFactory: () => {
        return new UrlProtocolConfig(SERVICE_PROTOCOL)
      },
    },
  ],
  exports: [CommentsService],
})
export class CommentsModule {}
