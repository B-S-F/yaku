import { ServiceType } from '../utils/enums/serviceType.enum'
import { Core } from '../utils/interfaces/core.interface'
import { Finding } from '../utils/interfaces/finding.interface'

export class CreateMetricDTO {
  service: ServiceType
  metric: Core | Finding
}
