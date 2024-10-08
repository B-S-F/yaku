import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export const OVERRIDE_UNIQUE_PER_RELEASE_CONSTRAINT =
  'same_check_may_not_overridden_multiple_times'

export class CheckReference {
  chapter: string
  requirement: string
  check: string

  constructor(chapter: string, requirement: string, check: string) {
    this.chapter = chapter
    this.requirement = requirement
    this.check = check
  }
}

export enum CheckColor {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
  ERROR = 'ERROR',
  FAILED = 'FAILED',
  UNANSWERED = 'UNANSWERED',
  NA = 'NA',
  PENDING = 'PENDING',
}

export const checkColors = [
  CheckColor.GREEN,
  CheckColor.YELLOW,
  CheckColor.RED,
  CheckColor.ERROR,
  CheckColor.FAILED,
  CheckColor.UNANSWERED,
  CheckColor.NA,
  CheckColor.PENDING,
] as const

export class AddOverrideDto {
  @ApiProperty({
    description: 'Path to the check for which the result is overridden',
    example: { chapter: '1', requirement: '1', check: '1' },
  })
  reference: CheckReference

  @ApiProperty({
    description: 'Reason for overriding the check result',
    example: 'Not applicable for US markets',
  })
  comment: string

  @ApiProperty({
    description: 'Specify the new color for the overridden check result',
    example: 'GREEN',
  })
  manualColor: CheckColor

  @ApiProperty({
    description: "Specify the the original check result's color",
    example: 'RED',
  })
  originalColor: CheckColor
}

export class OverrideDto {
  @ApiProperty({
    description: 'Service defined identifier of the override, treat as opaque',
    example: 53,
  })
  id: number

  @ApiProperty({
    description: 'Path to the check for which the result is overridden',
    example: { chapter: '1', requirement: '1', check: '1' },
  })
  reference: CheckReference

  @ApiProperty({
    description: 'Reason for overriding the check result',
    example: 'Not applicable for US markets',
  })
  comment: string

  @ApiProperty({
    description: 'Specify the new color for the overridden check result',
    example: 'GREEN',
  })
  manualColor: CheckColor

  @ApiProperty({
    description: "Specify the the original check result's color",
    example: 'RED',
  })
  originalColor: CheckColor

  @ApiProperty({
    description:
      'Date and time when the override was last modified(ISO 8601 without timezone offsets)',
    example: '2024-03-25T15:40:27.026Z',
  })
  lastModificationTime: Date

  @ApiProperty({
    description: 'Id of the user that last modified the override',
    example: 'f6ce7976-dd70-4afc-b58f-85bcd37ffae6',
  })
  userId: string
}

export class UpdateOverrideDto {
  @ApiProperty({
    description: 'Specify the new color for the overridden check result',
    example: 'GREEN',
  })
  manualColor: CheckColor

  @ApiProperty({
    description: "Specify the the original check result's color",
    example: 'RED',
  })
  originalColor: CheckColor

  @ApiProperty({
    description: 'Reason for updating the override',
    example: 'Select the right status this time',
  })
  comment: string
}

const targetColors = z.enum([
  CheckColor.RED,
  CheckColor.YELLOW,
  CheckColor.GREEN,
])

export const addOverrideDtoSchema = z
  .object({
    reference: z.object({
      chapter: z.string().trim().min(1),
      requirement: z.string().trim().min(1),
      check: z.string().trim().min(1),
    }),
    comment: z.string().trim().min(1),
    manualColor: targetColors,
    originalColor: z.nativeEnum(CheckColor),
  })
  .strict()

export const updateOverrideDtoSchema = z
  .object({
    manualColor: targetColors,
    originalColor: z.nativeEnum(CheckColor),
    comment: z.string().trim().min(1),
  })
  .strict()
