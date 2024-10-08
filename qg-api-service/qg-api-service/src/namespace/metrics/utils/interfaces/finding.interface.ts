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
