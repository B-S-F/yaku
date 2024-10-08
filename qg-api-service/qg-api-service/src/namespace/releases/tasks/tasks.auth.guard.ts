/* eslint-disable no-unused-vars */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { ENABLE_TASKS_CONTROLLER } from '../../../config'

@Injectable()
export class TaskAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (ENABLE_TASKS_CONTROLLER !== 'true') {
      throw new UnauthorizedException(
        'Tasks endpoints are behind a feature flag. Set the env var ENABLE_TASKS_CONTROLLER to true to activate.'
      )
    }

    return true
  }
}
