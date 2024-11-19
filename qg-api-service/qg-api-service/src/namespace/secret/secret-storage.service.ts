// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export abstract class SecretStorage {
  abstract getSecrets(namespaceId: number): Promise<{ [key: string]: string }>
  abstract storeSecret(
    namespaceId: number,
    name: string,
    secretValue: string
  ): Promise<void>
  abstract deleteSecret(namespaceId: number, name: string): Promise<void>
}
