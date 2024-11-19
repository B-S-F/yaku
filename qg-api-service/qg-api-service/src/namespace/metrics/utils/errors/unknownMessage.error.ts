// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export class UnknownMessageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnknownMessageError'
  }
}
