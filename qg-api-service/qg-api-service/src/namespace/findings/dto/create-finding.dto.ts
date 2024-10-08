import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsNotEmptyObject,
  Allow,
} from 'class-validator'
import { RunOverallStatusType } from '../utils/enums/runOverallStatusType.enum'
import { StatusType } from '../utils/enums/statusType.enum'
import { Metadata } from '../utils/interfaces/findingsInterfaces'
import { RunStatus } from '../../run/run.entity'

export class CreateFindingDTO {
  @ApiProperty({
    example: { package: 'vm2', severity: 'HIGH' },
    description: 'The metadata object with dynamic key-value pairs.',
  })
  @IsNotEmptyObject()
  @Allow()
  @IsOptional()
  metadata?: Metadata

  @ApiProperty({
    example: 5,
    description: 'The ID of the config associated with the finding.',
  })
  @IsInt()
  configId: number

  @ApiProperty({
    example: 11,
    description: 'The ID of the run associated with the finding.',
  })
  @IsInt()
  runId: number

  @ApiProperty({
    example: 'completed',
    description: 'The status of the run associated with the finding.',
    enum: RunStatus,
  })
  @IsEnum(RunStatus)
  runStatus: RunStatus

  @ApiProperty({
    example: 'RED',
    description:
      'The overall result of the run associated with the finding (if completed).',
    enum: RunOverallStatusType,
  })
  @IsEnum(RunOverallStatusType, { each: true })
  runOverallResult: RunOverallStatusType

  @ApiProperty({
    example: '2023-06-02T14:28:13.000Z',
    description:
      'The completion time of the run associated with the finding (if completed or failed).',
  })
  @IsString()
  runCompletionTime: string

  @ApiProperty({
    example: '1',
    description: 'The chapter number from the QG Config.',
  })
  @IsString()
  chapter: string

  @ApiProperty({
    example: '1.1',
    description: 'The requirement number from the QG Config.',
  })
  @IsString()
  requirement: string

  @ApiProperty({
    example: '1.1',
    description: 'The check number from the QG Config.',
  })
  @IsString()
  check: string

  @ApiProperty({
    example: 'Vulnerability scans of qg-apps-typescript',
    description:
      'The criterion for performing the checks and identify findings.',
  })
  @IsString()
  criterion: string

  @ApiProperty({
    example:
      'In vm2 for version up to 3.9.19, inspect functions allows attackers to escape the sandbox and run arbitrary code.',
    description: 'The reason why the criterion was not met.',
  })
  @IsString()
  justification: string

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
    example: 'unresolved',
    description: 'The status of the finding (resolved or unresolved).',
    enum: StatusType,
  })
  @IsEnum(StatusType, { each: true })
  status: StatusType

  @ApiProperty({
    example: 'It was resolved',
    description: 'The comment describing the resolution of the finding.',
    required: false,
  })
  @IsOptional()
  @IsString()
  resolvedComment?: string

  @ApiProperty({
    example: 'Yaku',
    description: 'Resolver of the finding.',
    required: false,
  })
  @IsOptional()
  @IsString()
  resolver?: string
}
