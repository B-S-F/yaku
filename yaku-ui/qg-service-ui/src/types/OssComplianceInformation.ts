// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type Component = {
  name: string
  group: string
  version: string
  description: string
  purl?: string
  copyright: Set<string>
  type: string
  licenses: {
    license: {
      id: string
      name: string
      url?: string
      text?: string
    }
  }[]
  hashes?: {
    alg: string
    content: string
  }[]
  externalReferences: {
    type: string
    url: string
  }[]
}
