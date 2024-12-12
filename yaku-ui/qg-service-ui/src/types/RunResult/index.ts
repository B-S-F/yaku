// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export * from './RunResultV0'
export * from './RunResultV1'
export type { RunResultStatus, ManualStatus } from './Common'

import type { RunResultV0 } from './RunResultV0'
import type { RunResultV1 } from './RunResultV1'
export type RunResult = RunResultV0 | RunResultV1
