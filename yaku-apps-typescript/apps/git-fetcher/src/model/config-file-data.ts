// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { z } from 'zod'
import { parse } from 'date-fns'

/* Follows the schema dd-mm-yyyy **/
const dateRegex = /^[0-9]{2}-[0-9]{2}-[0-9]{4,}$/
const dateFormat = 'dd-MM-yyyy'

/* 'DECLINED', 'MERGED', 'OPEN', 'ALL' only valid for Bitbucket. GitHub needs lowercase. */
export const allowedFilterState = ['DECLINED', 'MERGED', 'OPEN', 'ALL'] as const
export type AllowedFilterStateType = (typeof allowedFilterState)[number]

export const gitFetcherPullRequests = [
  'pull-request',
  'pull-requests',
  'pr',
  'prs',
  'pullrequest',
  'pullrequests',
  'pull',
  'pulls',
] as const

const gitFetcherResources = [
  ...gitFetcherPullRequests,
  'branches',
  'tags',
  'metadata-and-diff',
] as const

export const GitConfigResourceSchema = z.enum(gitFetcherResources)
export type GitConfigResource = z.infer<typeof GitConfigResourceSchema>

const BaseFilterSchema = z.object({
  state: z.enum(allowedFilterState).optional(),
})

const DateFilterSchema = z.object({
  startDate: z
    .string()
    .regex(dateRegex, `date must match the format ${dateFormat.toLowerCase()}`)
    .transform((val) => parse(val, dateFormat, Date.now()))
    .transform((val: Date) => {
      val.setHours(0)
      val.setMinutes(0)
      val.setSeconds(0)
      val.setMilliseconds(0)
      return val
    })
    .optional(),
  endDate: z
    .string()
    .regex(dateRegex, `date must match the format ${dateFormat.toLowerCase()}`)
    .transform((val) => parse(val, dateFormat, Date.now()))
    .transform((val: Date) => {
      val.setHours(23)
      val.setMinutes(59)
      val.setSeconds(59)
      val.setMilliseconds(999)
      return val
    })
    .optional(),
})

const CommitHashFilterSchema = z.object({
  startHash: z.string().min(1).optional(),
  endHash: z.string().min(1).optional(),
})

const TagFilterSchema = z.object({
  startTag: z.string().min(1).optional(),
  endTag: z.string().min(1).optional(),
})

const FilterSchema = BaseFilterSchema.merge(DateFilterSchema)
  .merge(CommitHashFilterSchema)
  .merge(TagFilterSchema)
  .refine((arg) => {
    function isDefined(value: any): boolean {
      return value !== undefined
    }

    // transform each boolean to 0 or 1, so that it can be summed up
    const hasDateFilter: 0 | 1 = Number(
      isDefined(arg.startDate) || isDefined(arg.endDate)
    ) as 0 | 1
    const hasHashFilter: 0 | 1 = Number(
      isDefined(arg.startHash) || isDefined(arg.endHash)
    ) as 0 | 1
    const hasTagFilter: 0 | 1 = Number(
      isDefined(arg.startTag) || isDefined(arg.endTag)
    ) as 0 | 1

    // the sum shows how many of the filters were defined in config file
    const numberOfFilters: number = hasDateFilter + hasHashFilter + hasTagFilter
    // there must be no more than one filter type defined
    return numberOfFilters <= 1
  }, 'Combining the date, hash and/or tag filter is not possible')
  .refine(
    (arg) => !(arg.endHash && !arg.startHash),
    'Specify filter.startHash if filter.endHash is provided'
  )
  .refine(
    (arg) => !(arg.endTag && !arg.startTag),
    'Specify filter.startTag if filter.endTag is provided'
  )
  .refine(
    (arg) => !(arg.endDate && !arg.startDate),
    'Specify filter.startDate if filter.endDate is provided'
  )
  .refine(
    (arg) => !(arg.endDate && arg.startDate && arg.endDate < arg.startDate),
    'filter.endDate must be after or equal filter.startDate'
  )

export const GitFetcherConfigSchema = z.object({
  org: z.string().min(1),
  repo: z.string().min(1),
  resource: GitConfigResourceSchema,
  labels: z.array(z.string().min(1)).optional(),
  filter: FilterSchema.optional(),
  filePath: z.string().optional(),
})

export type DateFilter = z.infer<typeof DateFilterSchema>

export type HashFilter = z.infer<typeof CommitHashFilterSchema>

export type TagFilter = z.infer<typeof TagFilterSchema>

export type GitFetcherConfig = z.infer<typeof GitFetcherConfigSchema>

export class ConfigFileData {
  constructor(public data: GitFetcherConfig) {}
}
