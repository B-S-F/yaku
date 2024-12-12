// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { dump, load } from 'js-yaml'
import { AutopilotSnippet } from '~/types'
import { OnyxConfiguration } from '~/types/OnyxConfiguration'

export const dumpConfiguration = (configuration: OnyxConfiguration): string =>
  dump(configuration, { lineWidth: -1 })

export const loadConfiguration = (configuration: string): OnyxConfiguration =>
  load(configuration) as OnyxConfiguration

export const dumpAutopilot = (obj: { [name: string]: AutopilotSnippet }) =>
  dump(obj, { lineWidth: -1 })
