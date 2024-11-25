// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { z } from 'zod'

export const MetadataSchema = z.object({
  version: z.string(),
})

export const HeaderSchema = z.object({
  name: z.string(),
  version: z.string(),
  date: z.string(),
  toolVersion: z.string(),
})

export const StatisticsSchema = z.object({
  'counted-checks': z.number(),
  'counted-automated-checks': z.number(),
  'counted-manual-check': z.number(),
  'counted-unanswered-checks': z.number(),
  'counted-skipped-checks': z.number(),
  'degree-of-automation': z.number(),
  'degree-of-completion': z.number(),
})

export const AutopilotResultSchema = z.object({
  criterion: z.string(),
  fulfilled: z.boolean(),
  justification: z.string(),
  metadata: z.record(z.string(), z.string()).optional(),
})

export const ExecutionInformationSchema = z.object({
  logs: z.string().array().optional(),
  errorLogs: z.string().array().optional(),
  evidencePath: z.string(),
  exitCode: z.number(),
})

export const CheckResultSchema = z.object({
  autopilot: z.string().optional(),
  status: z.enum([
    'GREEN',
    'YELLOW',
    'RED',
    'NA',
    'UNANSWERED',
    'FAILED',
    'ERROR',
  ]),
  reason: z.string(),
  results: AutopilotResultSchema.array().optional(),
  outputs: z.record(z.string(), z.string()).optional(),
  execution: ExecutionInformationSchema.optional(),
})

export const CheckSchema = z.object({
  title: z.string(),
  status: z.enum([
    'GREEN',
    'YELLOW',
    'RED',
    'NA',
    'UNANSWERED',
    'FAILED',
    'ERROR',
  ]),
  type: z.enum(['manual', 'automation', 'Manual', 'Automation']),
  evaluation: CheckResultSchema,
})

export const RequirementSchema = z.object({
  title: z.string(),
  text: z.string().optional(),
  status: z.enum([
    'GREEN',
    'YELLOW',
    'RED',
    'NA',
    'UNANSWERED',
    'FAILED',
    'ERROR',
  ]),
  checks: z.record(z.string(), CheckSchema).optional(),
})

export const ChapterSchema = z.object({
  title: z.string(),
  text: z.string().optional(),
  status: z.enum([
    'GREEN',
    'YELLOW',
    'RED',
    'NA',
    'UNANSWERED',
    'FAILED',
    'ERROR',
  ]),
  requirements: z.record(z.string(), RequirementSchema),
})

export const FinalizeSchema = z.object({
  execution: ExecutionInformationSchema,
})

export const StepSchema = z.object({
  title: z.string().optional(),
  id: z.string(),
  depends: z.string().array().optional(),
  logs: z.string().array(),
  warnings: z.string().array().optional(),
  messages: z.string().array().optional(),
  configFiles: z.string().array().optional(),
  outputDir: z.string(),
  resultFile: z.string(),
  inputDirs: z.string().array().optional(),
  exitCode: z.number(),
})

export const AutopilotSchema = z.object({
  name: z.string(),
  steps: StepSchema.array(),
})

export const EvaluationResultSchema = z.object({
  criterion: z.string(),
  fulfilled: z.boolean(),
  justification: z.string(),
  metadata: z.record(z.string()).optional(),
})

export const EvaluationSchema = z.object({
  status: z.enum(['GREEN', 'YELLOW', 'RED', 'ERROR']),
  reason: z.string(),
  results: EvaluationResultSchema.array().optional(),
  logs: z.string().array(),
  warnings: z.string().array().optional(),
  messages: z.string().array().optional(),
  configFiles: z.string().array().optional(),
  exitCode: z.number(),
})

export const CheckSchemaV2 = z.object({
  title: z.string(),
  type: z.enum(['manual', 'automation', 'Manual', 'Automation']),
  autopilots: AutopilotSchema.array().optional(),
  evaluation: EvaluationSchema,
})

export const RequirementSchemaV2 = z.object({
  title: z.string(),
  text: z.string().optional(),
  status: z.enum(['GREEN', 'YELLOW', 'RED', 'NA', 'UNANSWERED', 'ERROR']),
  checks: z.record(z.string(), CheckSchemaV2),
})

export const ChapterSchemaV2 = z.object({
  title: z.string(),
  text: z.string().optional(),
  status: z.enum(['GREEN', 'YELLOW', 'RED', 'NA', 'UNANSWERED', 'ERROR']),
  requirements: z.record(z.string(), RequirementSchemaV2),
})

export const FinalizeSchemaV2 = z.object({
  logs: z.string().array().optional(),
  warnings: z.string().array().optional(),
  messages: z.string().array().optional(),
  configFiles: z.string().array().optional(),
  exitCode: z.number(),
})

export const ResultSchemaV1 = z.object({
  metadata: MetadataSchema,
  header: HeaderSchema,
  overallStatus: z.enum([
    'GREEN',
    'YELLOW',
    'RED',
    'NA',
    'UNANSWERED',
    'FAILED',
    'ERROR',
  ]),
  statistics: StatisticsSchema,
  chapters: z.record(z.string(), ChapterSchema),
  finalize: FinalizeSchema.optional(),
})

export const ResultSchemaV2 = z.object({
  metadata: MetadataSchema,
  header: HeaderSchema,
  overallStatus: z.enum([
    'GREEN',
    'YELLOW',
    'RED',
    'NA',
    'UNANSWERED',
    'ERROR',
  ]),
  statistics: StatisticsSchema,
  chapters: z.record(z.string(), ChapterSchemaV2),
  finalize: FinalizeSchemaV2.optional(),
})
