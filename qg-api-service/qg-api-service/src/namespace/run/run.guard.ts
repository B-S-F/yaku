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
import { ENABLE_SYNTHETIC_RUN_ENDPOINT } from '../../config'

@Injectable()
export class SyntheticRunGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (ENABLE_SYNTHETIC_RUN_ENDPOINT !== 'true') {
      throw new UnauthorizedException(
        'Synthetic Runs are behind a feature flag. Set the env var ENABLE_SYNTHETIC_RUN_ENDPOINT to true to activate',
      )
    }

    return true
  }
}
