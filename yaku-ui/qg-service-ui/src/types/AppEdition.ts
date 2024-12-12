// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { App, Parameter } from './AppCatalog'

export type ParameterValue = {
  parameter: Parameter
  value: string
}

export type AppFilled = {
  app: App
  args: ParameterValue[]
  envs: ParameterValue[]
}
