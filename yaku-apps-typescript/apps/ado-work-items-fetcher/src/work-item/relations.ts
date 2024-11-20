// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { z } from 'zod'
export const relationTypes = ['Related', 'Child', 'Parent'] as const
const RelationTypesLiterals = relationTypes.map((relationType) =>
  z.literal(relationType),
)
const [first, second, ...others] = RelationTypesLiterals
export const RelationTypeSchema = z.union([first, second, ...others])
export type RelationType = z.infer<typeof RelationTypeSchema>

const BaseRelationsSchema = z.object({
  get: z.boolean().optional(),
  relationType: RelationTypeSchema.optional(),
})

export type Relations = z.infer<typeof BaseRelationsSchema> & {
  relations?: Relations
}

export const RelationsSchema: z.ZodType<Relations> = BaseRelationsSchema.extend(
  {
    relations: z.lazy(() => RelationsSchema.optional()),
  },
)
