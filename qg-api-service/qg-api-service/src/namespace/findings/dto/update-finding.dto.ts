import { ApiProperty } from '@nestjs/swagger'
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNotEmptyObject,
  IsInt,
  Allow,
} from 'class-validator'
import { RunOverallStatusType } from '../utils/enums/runOverallStatusType.enum'
import { StatusType } from '../utils/enums/statusType.enum'
import { Metadata } from '../utils/interfaces/findingsInterfaces'
import { RunStatus } from '../../run/run.entity'

export class UpdateFindingDTO {
  @ApiProperty({
    example: { key1: 'value1', key2: 'value2' },
    description: 'The metadata object with dynamic key-value pairs.',
  })
  @IsNotEmptyObject()
  @Allow()
  @IsOptional()
  metadata?: Metadata

  @ApiProperty({
    example: 11,
    description: 'The ID of the run associated with the finding.',
  })
  @IsOptional()
  @IsInt()
  runId?: number

  @ApiProperty({
    example: '2023-06-02T14:28:13.000Z',
    description:
      'The completion time of the run associated with the finding (if completed or failed).',
  })
  @IsOptional()
  @IsString()
  runCompletionTime?: string

  @ApiProperty({
    example: 'RED',
    description:
      'The overall result of the run associated with the finding (if completed).',
    enum: RunOverallStatusType,
  })
  @IsOptional()
  @IsEnum(RunOverallStatusType, { each: true })
  runOverallResult?: RunOverallStatusType

  @ApiProperty({
    example: 'completed',
    description: 'The status of the run associated with the finding.',
    enum: RunStatus,
  })
  @IsOptional()
  @IsEnum(RunStatus)
  runStatus?: RunStatus

  @ApiProperty({
    example: 1,
    description:
      'The number of occurrences of a finding since it was saved in the database.',
    required: false,
  })
  @IsOptional()
  @IsInt()
  occurrenceCount?: number

  @ApiProperty({
    example: 'resolved',
    description: 'The updated status of the finding (resolved or unresolved).',
    enum: StatusType,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusType)
  status?: StatusType

  @ApiProperty({
    example: 'It was resolved',
    description:
      'The updated comment describing the resolution of the finding.',
    required: false,
  })
  @IsOptional()
  @IsString()
  resolvedComment?: string

  @ApiProperty({
    example: '2023-08-23T05:18:23.186Z',
    description: 'The timestamp when the finding was resolved.',
    required: false,
  })
  @IsOptional()
  @IsString()
  resolvedDate?: string

  @ApiProperty({
    example: 'Yaku',
    description: 'Resolver of the finding.',
    required: false,
  })
  @IsOptional()
  @IsString()
  resolver?: string
}
