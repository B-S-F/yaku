import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { SubscriptionEntity } from './entity/subscription.entity'
import { DeepPartial, Repository } from 'typeorm'
import { SubscriptionDto } from './subscription.dto'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { UserInNamespaceDto } from '../users/users.utils'
import { UsersService } from '../users/users.service'
@Injectable()
export class SubscriptionService {
  @InjectPinoLogger(SubscriptionService.name)
  private readonly logger = new PinoLogger({
    pinoHttp: {
      level: 'trace',
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    },
  })
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repository: Repository<SubscriptionEntity>,
    @Inject(UsersService)
    private readonly usersService: UsersService
  ) {}
  async createSubscription(
    userId: string,
    releaseId: number
  ): Promise<boolean> {
    if (!userId || !releaseId) {
      throw new BadRequestException(
        'Need both userId and approvalId for a subscription object'
      )
    }
    const nowDate = new Date()
    const newSubscription: DeepPartial<SubscriptionEntity> = {
      userId: userId,
      releaseId: releaseId,
      creationTime: nowDate,
    }
    const existingSubscription = await this.repository
      .createQueryBuilder('subscriptions')
      .where('subscriptions.userId = :userId', { userId })
      .andWhere('subscriptions.releaseId = :releaseId', { releaseId })
      .getOne()

    if (existingSubscription) {
      throw new HttpException(
        `Subscription of user with id: ${userId} to the release with id: ${releaseId} already exists.`,
        HttpStatus.CONFLICT
      )
    } else {
      const subscription = this.repository.create(newSubscription)
      const createdSubscription = await this.repository.save(subscription)

      if (!createdSubscription)
        throw new HttpException(
          `Subscription of user with id: ${userId} to the release with id: ${releaseId} failed to create.`,
          HttpStatus.EXPECTATION_FAILED
        )
      return true
    }
  }

  async deleteSubscription(
    userId: string,
    releaseId: number
  ): Promise<boolean> {
    const deletedSubscription = await this.repository.delete({
      userId: userId,
      release: { id: releaseId },
    })

    if (!deletedSubscription.affected)
      throw new HttpException(
        `Subscription of user with id: ${userId} to the release with id: ${releaseId} was not found.`,
        HttpStatus.NOT_FOUND
      )
    return true
  }

  async getSubscriptionStatus(
    userId: string,
    releaseId: number
  ): Promise<SubscriptionDto> {
    try {
      const existingSubscription = await this.repository
        .createQueryBuilder('subscriptions')
        .where('subscriptions.userId = :userId', { userId })
        .andWhere('subscriptions.releaseId = :releaseId', { releaseId })
        .getOne()

      if (existingSubscription) return new SubscriptionDto(existingSubscription)
      return null
    } catch (err) {
      this.logger.error(
        `Could not get subscripiton status of user with id: ${userId} to the release with id: ${releaseId} due to ${err}`
      )
      throw err
    }
  }
  async getSubscribers(releaseId: number, ignore: UserInNamespaceDto[] = []) {
    const subscriptions = await this.repository
      .createQueryBuilder('subscriptions')
      .where('subscriptions.releaseId = :releaseId', { releaseId })
      .getMany()
    const subcribers = new Map<string, UserInNamespaceDto>()

    for (const subscription of subscriptions) {
      try {
        subcribers.set(
          subscription.userId,
          await this.usersService.getUser(subscription.userId)
        )
      } catch (err) {
        this.logger.error(
          `Attempt to get user with id '${subscription.userId}' from namesapce failed due to ${err.message}`
        )
      }
    }

    for (const subscriber of ignore.values()) {
      subcribers.delete(subscriber.id)
    }
    return Array.from(subcribers.values())
  }
}
