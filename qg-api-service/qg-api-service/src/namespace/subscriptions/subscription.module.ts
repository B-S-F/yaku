import { Module } from '@nestjs/common'
import { SubscriptionEntity } from './entity/subscription.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SubscriptionController } from './subscription.controller'
import { SubscriptionService } from './subscription.service'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionEntity]), UsersModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
