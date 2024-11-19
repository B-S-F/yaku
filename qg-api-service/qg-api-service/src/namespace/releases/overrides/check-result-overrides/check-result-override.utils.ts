import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export const RESULT_OVERRIDE_UNIQUE_PER_RELEASE_CONTRAINT =
  'same_check_result_may_not_overridden_multiple_times'

export class CheckResultReference {
  chapter: string
  requirement: string
  check: string
  hash: string

  constructor(
    chapter: string,
    requirement: string,
    check: string,
    hash: string,
  ) {
    this.chapter = chapter
    this.requirement = requirement
    this.check = check
    this.hash = hash
  }
}

export class AddCheckResultOverrideDto {
  @ApiProperty({
    description:
      'Path to the check result for which the fulfilled property is overridden',
    example: {
      chapter: '1',
      requirement: '1',
      check: '1',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
  })
  reference: CheckResultReference

  @ApiProperty({
    description: 'Reason for overriding the fulfilled property',
    example: 'Not applicable for US markets',
  })
  comment: string

  @ApiProperty({
    description:
      'Specify the new fulfilled property for the overridden check result',
    example: true,
  })
  manualFulfilled: boolean

  @ApiProperty({
    description: "Specify the original check result's fulfilled property",
    example: false,
  })
  originalFulfilled: boolean
}

export class CheckResultOverrideDto {
  @ApiProperty({
    description: 'Service defined identifier of the override, treat as opaque',
    example: 53,
  })
  id: number

  @ApiProperty({
    description:
      'Path to the check result for which the fulfilled property is overridden',
    example: {
      chapter: '1',
      requirement: '1',
      check: '1',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
  })
  reference: CheckResultReference

  @ApiProperty({
    description: 'Reason for overriding the fulfilled property',
    example: 'Not applicable for US markets',
  })
  comment: string

  @ApiProperty({
    description:
      'Specify the new fulfilled property for the overridden check result',
    example: true,
  })
  manualFulfilled: boolean

  @ApiProperty({
    description: "Specify the original check result's fulfilled property",
    example: false,
  })
  originalFulfilled: boolean

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

export class UpdateCheckResultOverrideDto {
  @ApiProperty({
    description:
      'Specify the new fulfilled property for the overridden check result',
    example: true,
  })
  manualFulfilled: boolean

  @ApiProperty({
    description: "Specify the original check result's fulfilled property",
    example: false,
  })
  originalFulfilled: boolean

  @ApiProperty({
    description: 'Reason for updating the override',
    example: 'Select the right status this time',
  })
  comment: string
}

export const addCheckResultOverrideDtoSchema = z
  .object({
    reference: z.object({
      chapter: z.string().trim().min(1),
      requirement: z.string().trim().min(1),
      check: z.string().trim().min(1),
      hash: z.string().trim().min(1),
    }),
    comment: z.string().trim().min(1),
    manualFulfilled: z.boolean(),
    originalFulfilled: z.boolean(),
  })
  .strict()

export const updateCheckResultOverrideDtoSchema = z
  .object({
    manualFulfilled: z.boolean(),
    originalFulfilled: z.boolean(),
    comment: z.string().trim().min(1),
  })
  .strict()
