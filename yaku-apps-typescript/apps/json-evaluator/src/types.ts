// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { z } from 'zod'

import { CheckResults } from '@B-S-F/json-evaluator-lib'
import { ReasonPackage } from '@B-S-F/json-evaluator-lib/src/types'

const checkConditionRegex = />|<|>=|<=|===|==|!==|!=|includes/
const concatConditionRegex = /^(\w+)((\s*(&&|\|\|)\s*((\w+)*)))*$/
export const variableRegex = /^(\w+(\.\w+)*)$/

const Status = z.enum(['GREEN', 'YELLOW', 'RED'])

const CheckSchema = z
  .object({
    name: z.string().regex(variableRegex),
    ref: z.string().startsWith('$'),
    condition: z.string().regex(checkConditionRegex),
    true: Status.optional(),
    false: Status.optional(),
    log: z.string().startsWith('$').optional(),
    return_if_empty: Status.optional(),
    return_if_not_found: Status.optional(),
  })
  .strict()

const ConcatenationSchema = z
  .object({
    condition: z.string().regex(concatConditionRegex),
  })
  .strict()

export const ConfigSchema = z
  .object({
    checks: z.array(CheckSchema),
    concatenation: ConcatenationSchema.optional(),
  })
  .strict()

export type Config = z.infer<typeof ConfigSchema>
export type Check = z.infer<typeof CheckSchema>
export type Concatenation = z.infer<typeof ConcatenationSchema>
export type Status = z.infer<typeof Status>
export type ChecksResult = Record<string, CheckResults>
export type PartialCheckResult = Partial<
  Omit<CheckResults, 'reasonPackages'> & { reasonPackage: ReasonPackage }
>
