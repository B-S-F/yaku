import { ApiProperty } from '@nestjs/swagger'

export class GetFindingsDTO {
  constructor(
    configId: number,
    runId: number,
    count: number,
    diff: number,
    datetime: Date
  ) {
    this.configId = configId
    this.runId = runId
    this.count = count
    this.diff = diff
    this.datetime = datetime
  }

  @ApiProperty({
    description: 'Id of the config in the context of this namespace',
    example: 1,
  })
  configId: number

  @ApiProperty({
    description: 'Id of the run in the context of this namespace',
    example: 2,
  })
  runId: number

  @ApiProperty({
    description: 'Number of the findings of the current run',
    example: 3,
  })
  count: number

  @ApiProperty({
    description:
      'Diff between the findings count of the previous and current run',
    example: -2,
  })
  diff: number

  @ApiProperty({
    description: 'Timestamp when the metric was created',
    example: '1970-01-01T00:00:00.000Z',
  })
  datetime: Date
}
