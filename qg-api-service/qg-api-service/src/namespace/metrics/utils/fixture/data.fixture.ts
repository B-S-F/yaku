import { ServiceType } from '../enums/serviceType.enum'
import { SeverityType } from '../enums/severityType.enum'
import { StatusType } from '../../../findings/utils/enums/statusType.enum'
import { Finding } from '../interfaces/finding.interface'
import { CreateMetricDTO } from '../../dto/createMetric.dto'
import { GetMetricDTO } from '../../dto/getMetric.dto'
import { Metric } from '../../entity/metric.entity'
import { GetFindingsDTO } from '../../dto/getFindings.dto'
import { UpdateFindingDTO } from '../../dto/updateFinding.dto'

const findingData: Finding[] = [
  {
    id: '1',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.CRITICAL,
    namespaceId: 1,
    configId: 1,
    runId: 1,
    updated: new Date('2023'),
  },
  {
    id: '2',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.HIGH,
    namespaceId: 1,
    configId: 1,
    runId: 1,
    updated: new Date('2023'),
  },
  {
    id: '3',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.MEDIUM,
    namespaceId: 1,
    configId: 1,
    runId: 1,
    updated: new Date('2023'),
  },
  {
    id: '1',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.CRITICAL,
    namespaceId: 1,
    configId: 1,
    runId: 2,
    updated: new Date('2023'),
  },
  {
    id: '2',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.HIGH,
    namespaceId: 1,
    configId: 1,
    runId: 2,
    updated: new Date('2023'),
  },
  {
    id: '3',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.MEDIUM,
    namespaceId: 1,
    configId: 1,
    runId: 2,
    updated: new Date('2023'),
  },
  {
    id: '4',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.LOW,
    namespaceId: 1,
    configId: 1,
    runId: 2,
    updated: new Date('2023'),
  },
  {
    id: '5',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.NA,
    namespaceId: 1,
    configId: 1,
    runId: 2,
    updated: new Date('2023'),
  },
  {
    id: '6',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.CRITICAL,
    namespaceId: 1,
    configId: 1,
    runId: 2,
    updated: new Date('2023'),
  },
  {
    id: '1',
    status: StatusType.RESOLVED,
    severity: SeverityType.CRITICAL,
    namespaceId: 1,
    configId: 1,
    runId: 3,
    updated: new Date('2023'),
  },
  {
    id: '2',
    status: StatusType.RESOLVED,
    severity: SeverityType.HIGH,
    namespaceId: 1,
    configId: 1,
    runId: 3,
    updated: new Date('2023'),
  },
  {
    id: '3',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.MEDIUM,
    namespaceId: 1,
    configId: 1,
    runId: 3,
    updated: new Date('2023'),
  },
  {
    id: '4',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.LOW,
    namespaceId: 1,
    configId: 1,
    runId: 3,
    updated: new Date('2023'),
  },
  {
    id: '5',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.NA,
    namespaceId: 1,
    configId: 1,
    runId: 3,
    updated: new Date('2023'),
  },
  {
    id: '6',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.CRITICAL,
    namespaceId: 1,
    configId: 1,
    runId: 3,
    updated: new Date('2023'),
  },
  {
    id: '11',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.CRITICAL,
    namespaceId: 1,
    configId: 2,
    runId: 1,
    updated: new Date('2023'),
  },
  {
    id: '12',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.HIGH,
    namespaceId: 1,
    configId: 2,
    runId: 1,
    updated: new Date('2023'),
  },
  {
    id: '11',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.CRITICAL,
    namespaceId: 1,
    configId: 2,
    runId: 2,
    updated: new Date('2023'),
  },
  {
    id: '12',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.HIGH,
    namespaceId: 1,
    configId: 2,
    runId: 2,
    updated: new Date('2023'),
  },
  {
    id: '13',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.MEDIUM,
    namespaceId: 1,
    configId: 2,
    runId: 2,
    updated: new Date('2023'),
  },
  {
    id: '11',
    status: StatusType.RESOLVED,
    severity: SeverityType.CRITICAL,
    namespaceId: 1,
    configId: 2,
    runId: 3,
    updated: new Date('2023'),
  },
  {
    id: '12',
    status: StatusType.RESOLVED,
    severity: SeverityType.HIGH,
    namespaceId: 1,
    configId: 2,
    runId: 3,
    updated: new Date('2023'),
  },
  {
    id: '13',
    status: StatusType.UNRESOLVED,
    severity: SeverityType.MEDIUM,
    namespaceId: 1,
    configId: 2,
    runId: 3,
    updated: new Date('2023'),
  },
]

const metricData: Metric[] = findingData.map((finding: Finding) => {
  const metric = new Metric()
  metric.id = 'metric-uuid'
  metric.service = ServiceType.FINDINGS
  metric.metric = finding
  metric.creationTime = new Date()

  return metric
})

export const createMetricDTOFixtures: CreateMetricDTO[] = findingData.map(
  (item: Finding) => {
    return { service: ServiceType.FINDINGS, metric: item } as CreateMetricDTO
  }
)

export const updateFindingDTOFixtures: UpdateFindingDTO[] = findingData.map(
  (item: Finding) => {
    return {
      status: item.status,
      severity: item.severity,
      namespaceId: item.namespaceId,
      configId: item.configId,
      runId: item.runId,
      updated: item.updated,
    }
  }
)

export const getMetricDTOFixtures: GetMetricDTO[] = metricData.map(
  (metric: Metric) => new GetMetricDTO(metric)
)

export const getFindingsDTOFixtures: GetFindingsDTO[] = [
  new GetFindingsDTO(1, 1, 3, 3, new Date('2023')),
  new GetFindingsDTO(1, 2, 6, 3, new Date('2023')),
  new GetFindingsDTO(1, 3, 3, -3, new Date('2023')),
  new GetFindingsDTO(2, 1, 2, 2, new Date('2023')),
  new GetFindingsDTO(2, 2, 3, 1, new Date('2023')),
  new GetFindingsDTO(2, 3, 1, -2, new Date('2023')),
]
