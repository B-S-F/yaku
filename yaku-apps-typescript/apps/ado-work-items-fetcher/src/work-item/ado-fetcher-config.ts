import { RelationsSchema } from './relations.js'
import { z } from 'zod'

export const WorkItemsConfigSchema = z.object({
  query: z.string().min(1).optional(),
  neededFields: z.array(z.string().min(1)).optional(),
  hierarchyDepth: z.number().int().positive().optional(),
  relations: RelationsSchema.optional(),
})

export type WorkItemsConfig = z.infer<typeof WorkItemsConfigSchema>

export const AdoFetcherConfigSchema = z.object({
  workItems: WorkItemsConfigSchema,
})
export type AdoFetcherConfig = z.infer<typeof AdoFetcherConfigSchema>
