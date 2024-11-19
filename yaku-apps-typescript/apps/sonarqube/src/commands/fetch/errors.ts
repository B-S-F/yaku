// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { AppError } from '@B-S-F/autopilot-utils'

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }

  Reason(): string {
    return super.Reason()
  }
}

export class RequestError extends AppError {
  constructor(message: string) {
    super(message)
    this.name = 'RequestError'
  }

  Reason(): string {
    return super.Reason()
  }
}
