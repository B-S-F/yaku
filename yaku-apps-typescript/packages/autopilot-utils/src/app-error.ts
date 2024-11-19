// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export class AppError extends Error {
  private reason: string
  constructor(reason: string) {
    super(reason)
    this.reason = reason
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, AppError.prototype)
  }
  Reason(): string {
    return this.reason
  }
}
