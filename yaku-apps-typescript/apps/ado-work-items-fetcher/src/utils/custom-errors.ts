/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import { AppError } from '@B-S-F/autopilot-utils'

export class WorkItemsNotFoundError extends AppError {
  constructor(reason: string) {
    super(reason)
    this.name = 'WorkItemsNotFoundError'
  }

  Reason(): string {
    return super.Reason()
  }
}

export class EnvironmentError extends AppError {
  constructor(reason: string) {
    super(reason)
    this.name = 'EnvironmentError'
  }
  Reason(): string {
    return super.Reason()
  }
}
