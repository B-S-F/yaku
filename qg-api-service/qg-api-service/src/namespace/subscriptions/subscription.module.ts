// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Module } from '@nestjs/common'
import { SubscriptionEntity } from './entity/subscription.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SubscriptionController } from './subscription.controller'
import { SubscriptionService } from './subscription.service'
import { UsersModule } from '../users/users.module'
import { ReleaseEntity } from '../releases/release.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionEntity, ReleaseEntity]),
    UsersModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
