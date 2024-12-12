// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type AppParameter = {
  name: string
  description?: string
  example?: string
  optional?: boolean
}

export type App = {
  name: string
  envs: AppParameter[]
}
