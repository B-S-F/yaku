// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { SeverityType } from './../enums/severityType.enum'
import { StatusType } from '../../../findings/utils/enums/statusType.enum'

export interface Finding {
  id: string
  status: StatusType
  severity: SeverityType
  namespaceId: number
  configId: number
  runId: number
  updated: Date
}
