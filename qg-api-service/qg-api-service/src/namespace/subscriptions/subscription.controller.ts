import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import {
  Body,
  Controller,
  Param,
  Inject,
  Post,
  Req,
  HttpCode,
  Get,
} from '@nestjs/common'
import { validateBody } from '@B-S-F/api-commons-lib'
import { SubscriptionService } from './subscription.service'
import { z } from 'zod'
import { KeyCloakUser } from '@B-S-F/api-keycloak-auth-lib'
import { Request } from 'express'
import {
  SubscriptionDto,
  SubscriptionOperation,
  SubscriptionPostDto,
} from './subscription.dto'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'

const operationEnum = Object.values(SubscriptionOperation) as [
  string,
  ...string[]
]

const postSchema = z
  .object({
    releaseId: z.number(),
    operation: z.enum(operationEnum),
  })
  .strict()

@Controller('/subscriptions')
@ApiOAuth2(['openid'])
@ApiBearerAuth()
@ApiTags('Subscriptions')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
export class SubscriptionController {
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
    @Inject(SubscriptionService)
    private readonly subscriptionService: SubscriptionService
  ) {}

  @Post('/manage')
  @ApiOperation({
    summary:
      'Subscribe or unsubscribe to a release by creating or deleting a subscription resource.',
  })
  @HttpCode(200)
  @ApiBadRequestResponse({ description: 'Constraint violation on input data' })
  @ApiOkResponse({ description: 'Subscribe/unsubscribe successful.' })
  @ApiBody({ type: SubscriptionPostDto })
  async manageSubscription(
    @Body() body: SubscriptionPostDto,
    @Req() request: Request
  ): Promise<boolean> {
    const user: KeyCloakUser = request.user as KeyCloakUser
    const userKeyCloakSub = user.kc_sub

    try {
      validateBody(body, postSchema)

      if (body.operation === SubscriptionOperation.subscribe) {
        return await this.subscriptionService.createSubscription(
          userKeyCloakSub,
          body.releaseId
        )
      }
      if (body.operation === SubscriptionOperation.unsubscribe) {
        return await this.subscriptionService.deleteSubscription(
          userKeyCloakSub,
          body.releaseId
        )
      }

      throw new Error('Operation unknown')
    } catch (err) {
      const keyword = body.operation == 'subscribe' ? 'to' : 'from'
      this.logger.error(
        `Could not ${body.operation} the user with id: ${userKeyCloakSub} ${keyword} the release with id: ${body.releaseId} due to ${err}`
      )
      throw err
    }
  }

  @Get('/status/:userId/:releaseId')
  @ApiParam({ name: 'userId', description: 'userId of the user subscribed' })
  @ApiParam({ name: 'releaseId', description: 'releaseId' })
  async getSubscriptionStatus(
    @Param('userId') userId: string,
    @Param('releaseId') releaseId: number
  ): Promise<SubscriptionDto> {
    try {
      return this.subscriptionService.getSubscriptionStatus(userId, releaseId)
    } catch (err) {
      this.logger.error(
        `Coult not get subscription of the user with id: ${userId} to the release with id: ${releaseId} due to ${err}`
      )
      throw err
    }
  }
}
