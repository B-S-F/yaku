// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

/**
 * Temporary patch of qg-asnwers-schema to support "manualStatus" and "reason" in the syntax:
 *```yaml
 *     requirements:
 *       '1.5':
 *         title: The product development budget is met.
 *         text: The proportionate project budget was met in each project phase.
 *         manualStatus: GREEN
 *         reason: Bla
 *```
 */
export const patchQgAnswersSchema = (content: any) => {
  if (!content.allOf) return content
  Object.values(content.allOf[1].properties.allocations.properties).forEach(
    (v: any) => {
      Object.values(v.properties.requirements.properties).forEach(
        (requirement: any) => {
          requirement.additionalProperties = {
            manualStatus: {
              $ref: '@grow/qg-schemas/dist/qg-config-common.schema.json#/definitions/Status',
            },
            reason: {
              $ref: '@grow/qg-schemas/dist/qg-config-common.schema.json#/definitions/Reason',
            },
          }
          requirement.dependencies = {
            reason: ['manualStatus'],
            manualStatus: ['reason'],
          }
        },
      )
    },
  )

  return content
}
