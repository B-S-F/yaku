import {
  ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'
import { LONG_RUNNING_TOKEN_STRATEGY_NAME } from './long.running.strategy'

export const IsPublicAPI = 'isPublicApi'
export const Public = () => SetMetadata(IsPublicAPI, true)

@Injectable()
export class LongRunningTokenAuthGuard extends AuthGuard(
  LONG_RUNNING_TOKEN_STRATEGY_NAME
) {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {
    super()
  }

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic: boolean = this.reflector.getAllAndOverride(IsPublicAPI, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) {
      return true
    }

    return this.checkTokenStrategies(context)
  }

  private checkTokenStrategies(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context)
  }
}
