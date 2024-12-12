// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import NA from './ManualStatus_NA.vue'
import Success from './ManualStatus_Success.vue'
import Failed from './ManualStatus_Failed.vue'
import NotPassed from './ManualStatus_NotPassed.vue'
import Warning from './ManualStatus_Warning.vue'
import Unanswered from './ManualStatus_Unanswered.vue'

export type ManualStatusIcon =
  | typeof NA
  | typeof Success
  | typeof Failed
  | typeof NotPassed
  | typeof Warning
  | typeof Unanswered

export { NA, Success, Failed, NotPassed, Warning, Unanswered }
