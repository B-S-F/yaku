// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-unused-vars */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { ENABLE_RESULT_OVERRIDE_CONTROLLER } from '../../../../config'

@Injectable()
export class CheckResultOverrideAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (ENABLE_RESULT_OVERRIDE_CONTROLLER !== 'true') {
      throw new UnauthorizedException(
        'Override endpoints are behind a feature flag. Set the env var ENABLE_RESULT_OVERRIDE_CONTROLLER to true to activate.'
      )
    }

    return true
  }
}
