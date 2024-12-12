// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type SecretMetadata = {
  name: string
  description?: string
  creationTime: string
  lastModificationTime: string
}
export type Secret = SecretMetadata & { secret: string }
