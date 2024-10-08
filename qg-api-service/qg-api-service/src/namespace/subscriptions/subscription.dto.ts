import { ApiProperty } from '@nestjs/swagger'
import { SubscriptionEntity } from './entity/subscription.entity'

export class SubscriptionDto {
  constructor(subscription: SubscriptionEntity) {
    ;(this.userId = subscription.userId),
      (this.releaseId = subscription.releaseId)
    this.creationTime = subscription.creationTime
  }
  @ApiProperty({
    description: 'Id of the user which is subscribing to the release.',
    type: 'string',
    example: 'a4f523a2-6c1e-4bc3-9a08-2347c529a78d',
  })
  userId: string

  @ApiProperty({
    description: 'Id of the release which the user is subscribing to.',
    type: 'integer',
    example: 1,
  })
  releaseId: number

  @ApiProperty({
    description: 'Creation time of the subscription resource',
    example: '2022-10-21 12:12:30.000',
  })
  creationTime: Date
}

export enum SubscriptionOperation {
  subscribe = 'subscribe',
  unsubscribe = 'unsubscribe',
}

export class SubscriptionPostDto {
  @ApiProperty({
    description: 'Id of the release which the user is subscribing to.',
    type: 'integer',
    example: 1,
  })
  releaseId: number

  @ApiProperty({
    description: 'Operation to be performed.',
    enum: SubscriptionOperation,
    example: 'subscribe',
  })
  operation: SubscriptionOperation
}
