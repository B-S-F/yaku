// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { SeverityType } from '../utils/enums/severityType.enum'
import { StatusType } from '../../findings/utils/enums/statusType.enum'

export class UpdateFindingDTO {
  status: StatusType
  severity: SeverityType
  namespaceId: number
  configId: number
  runId: number
  updated: Date
}
