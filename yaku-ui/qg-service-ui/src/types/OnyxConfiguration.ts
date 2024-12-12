// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type Env = Record<string, string>
export type AutopilotEnv = Env
export type AutomationEnv = Env
export type Var = 'vars' | 'env'

export type Manual = {
  status: string
  reason: string
}

export type Automation = {
  autopilot: string
  config?: string[]
  env?: AutomationEnv
}

export type Autopilot = {
  run: string
  config?: string[]
  env?: AutopilotEnv
}

export type CheckConfiguration = {
  title: string
  automation?: Automation
  manual?: Manual
}
export type AutomatedCheck = {
  title: string
  automation: Automation
  manual?: undefined
}
export type ManualCheck = {
  title: string
  automation?: undefined
  manual: Manual
}

export type RequirementConfiguration = {
  title: string
  text?: string
  checks: Record<string, CheckConfiguration>
}

export type ChapterConfiguration = {
  title: string
  text?: string
  requirements: Record<string, RequirementConfiguration>
}

/**
 * JSON representation of the YAML configuration file
 *
 * See the [Go definitions](https://github.com/B-S-F/yaku/tree/main/onyx/pkg/configuration) of such a configuration,
 * or a [representative example](https://github.com/B-S-F/yaku/blob/main/onyx/cmd/cli/exec/testdata/v1/configuration/qg-config.yaml)
 */
export type OnyxConfiguration = {
  metadata: {
    version: 'v1'
  }
  header: {
    name: string
    version: string
  }
  env?: Env
  chapters: Record<string, ChapterConfiguration>
  default?: {
    vars?: Env
  }
  dependencies: any
  autopilots: Record<string, Autopilot>
  finalize: any
}
