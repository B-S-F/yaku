/* eslint-disable no-unused-vars */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { ENABLE_OVERRIDE_CONTROLLER } from '../../../config'

@Injectable()
export class OverrideAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (ENABLE_OVERRIDE_CONTROLLER !== 'true') {
      throw new UnauthorizedException(
        'Override endpoints are behind a feature flag. Set the env var ENABLE_OVERRIDE_CONTROLLER to true to activate.'
      )
    }

    return true
  }
}
