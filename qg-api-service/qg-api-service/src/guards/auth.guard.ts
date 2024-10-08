import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { KeyCloakAuthGuard } from './keycloak-auth.guard'
import { PinoLogger, Logger, InjectPinoLogger } from 'nestjs-pino'
import { QG_LOG_LEVEL } from '../config'
import { LongRunningTokenAuthGuard } from '../user/long-running-token/long.running.token.auth.guard'

@Injectable()
export class CoreAuthGuard implements CanActivate {
  @InjectPinoLogger(CoreAuthGuard.name)
  private readonly logger = new Logger(
    new PinoLogger({
      pinoHttp: {
        level: QG_LOG_LEVEL,
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
      },
    }),
    {}
  )

  constructor(
    @Inject(KeyCloakAuthGuard) private readonly keyCloakAuthGuard,
    @Inject(LongRunningTokenAuthGuard)
    private readonly longRunningTokenAuthGuard
  ) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    return this.checkAccess(context)
  }

  async checkAccess(context: ExecutionContext) {
    let keyCloakActivated = false
    let longRunningTokenActivated = false
    let error
    try {
      keyCloakActivated = await this.keyCloakAuthGuard.canActivate(context)
    } catch (e) {
      error = e
    }
    try {
      longRunningTokenActivated =
        await this.longRunningTokenAuthGuard.canActivate(context)
    } catch (e) {
      error = e
    }
    if (!keyCloakActivated && !longRunningTokenActivated && error) {
      this.logger.debug({
        msg: `authorization at all auth guards failed with: ${error.message}`,
      })
      throw new UnauthorizedException()
    }
    return keyCloakActivated || longRunningTokenActivated
  }
}
