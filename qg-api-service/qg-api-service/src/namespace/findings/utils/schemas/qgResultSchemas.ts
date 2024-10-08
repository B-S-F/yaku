import { z } from 'zod'

const EvaluationSchema = z.object({
  criterion: z.string(),
  justification: z.string(),
  fulfilled: z.boolean(),
  metadata: z.record(z.any()).optional(),
})

const EvaluationsSchema = z.array(EvaluationSchema).optional()

const CheckSchema = z.object({
  status: z.string(),
  evaluation: z.object({
    results: EvaluationsSchema,
  }),
})

const RequirementSchema = z.object({
  checks: z.record(CheckSchema),
})

const ChapterSchema = z.object({
  requirements: z.record(RequirementSchema),
})

export const DataSchema = z.object({
  chapters: z.record(ChapterSchema),
})
