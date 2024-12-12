// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type Namespace = {
  id: number
  name: string
  users: Array<{
    id: number
    username: string
    roles: string
  }>
}

/** Payload expected to run a single check of a configuration */
export type SingleCheck = {
  chapter: string
  requirement: string
  check: string
}

export type NamespaceUser = {
  id: string
  displayName: string
  username: string
}
