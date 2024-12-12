// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from './App'

export type Autopilot = {
  name: string
  description: string
  apps: App[]
}

export type AutopilotSnippet = {
  run: string
  env: Record<string, string>
}
