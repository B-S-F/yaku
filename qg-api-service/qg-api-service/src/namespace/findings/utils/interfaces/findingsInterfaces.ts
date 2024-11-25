// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export interface Metadata {
  [key: string]: any
}

export interface HashFields {
  namespaceId: number
  configId: number
  chapter: string
  requirement: string
  check: string
  criterion: string
  justification: string
}
