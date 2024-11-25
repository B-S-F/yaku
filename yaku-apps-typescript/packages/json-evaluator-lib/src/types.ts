/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod'

const statusSchema = z.enum(['GREEN', 'YELLOW', 'RED'])
const SearchOnFailSchema = z.boolean()
const ReasonPackageSchema = z
  .object({
    context: z.any(),
    reasons: z.array(z.any()),
  })
  .strict()

const checkResultsSchema = z.object({
  ref: z.string(),
  condition: z.string(),
  status: statusSchema,
  bool: z.boolean(),
  reasonPackages: z.array(ReasonPackageSchema).optional(),
})

const concatenationResultSchema = z.object({
  condition: z.string(),
  status: statusSchema,
})

export type CheckResults = z.infer<typeof checkResultsSchema>
export type ConcatenationResult = z.infer<typeof concatenationResultSchema>
export type Status = z.infer<typeof statusSchema>
export type SearchOnFail = z.infer<typeof SearchOnFailSchema>
export type ReasonPackage = z.infer<typeof ReasonPackageSchema>
