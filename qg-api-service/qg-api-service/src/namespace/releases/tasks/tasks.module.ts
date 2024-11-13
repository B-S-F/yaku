import {
  UrlHandlerFactory,
  UrlProtocolConfig,
} from '@B-S-F/api-commons-lib'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SERVICE_PROTOCOL } from '../../../config'
import { NotificationModule } from '../../../notifications/notification.module'
import { UsersModule } from '../../users/users.module'
import { TaskNotificationsService } from './task-notifications.service'
import { TaskController } from './tasks.controller'
import {
  TaskAuditEntity,
  TaskAuditService,
  TaskEntity,
  TaskNotificationEntity,
} from './tasks.entity'
import { TaskService } from './tasks.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskEntity,
      TaskAuditEntity,
      TaskNotificationEntity,
    ]),
    NotificationModule,
    UsersModule,
  ],
  controllers: [TaskController],
  providers: [
    TaskService,
    UrlHandlerFactory,
    TaskAuditService,
    TaskNotificationsService,
    {
      provide: UrlProtocolConfig,
      useFactory: () => {
        return new UrlProtocolConfig(SERVICE_PROTOCOL)
      },
    },
  ],
  exports: [TaskService],
})
export class TaskModule {}
