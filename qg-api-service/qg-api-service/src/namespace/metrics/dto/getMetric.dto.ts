import { ServiceType } from '../utils/enums/serviceType.enum'
import { Core } from '../utils/interfaces/core.interface'
import { Finding } from '../utils/interfaces/finding.interface'
import { Metric } from '../entity/metric.entity'
import { ApiProperty } from '@nestjs/swagger'

export class GetMetricDTO {
  constructor(metric: Metric) {
    this.service = metric.service
    this.metric = metric.metric
  }

  @ApiProperty()
  readonly service: ServiceType

  @ApiProperty({
    anyOf: [
      {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string', enum: ['unresolved', 'resolved'] },
          severity: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical', 'N/A'],
          },
          namespaceId: { type: 'string' },
          configId: { type: 'string' },
          runId: { type: 'string' },
          updated: { type: 'string' },
        },
      },
      { type: 'object', properties: { myProp: { type: 'string' } } },
    ],
  })
  readonly metric: Core | Finding

  @ApiProperty()
  readonly creationTime: Date
}
