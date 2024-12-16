// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { MaybeRef } from '@vueuse/core'
import type { SchemasSettings } from 'monaco-yaml'
import type { JSONSchema7 } from 'json-schema'
import type { EditorFile } from '../useEditorFiles'
import { computed, unref } from 'vue'
import { load } from 'js-yaml'
import { MAIN_CONFIG_COMPLETION_FILE, MAIN_CONFIG_FILE } from '~/config/editor'
import { patchQgAnswersSchema } from '../useQgAnswersSchemaPatch'
import QgConfigSchemaV0 from '~/config/schemas/v0/qg-config.schema.json'
import QgConfigSchemaCommonV0 from '~/config/schemas/v0/qg-config-common.schema.json'
import QgConfigSchemaV1 from '~/config/schemas/qg-config-schema.json'

// live patch the url to turn it into an id
// monaco yaml will turn it into a URL, and these needs to work
QgConfigSchemaV1.$id = QgConfigSchemaV1.$id.replace('https://', '')

type MainConfigFileVersion = 'v0' | 'v1'

/** Uri matcher for qg-config file */
const QG_CONFIG_FILEMATCH = [MAIN_CONFIG_FILE]
const PREFIX = 'schemaservice://combinedschema'

const STATIC_SCHEMAS = {
  v0: [
    {
      uri: `${PREFIX}/${QgConfigSchemaV0['$id']}`, // id of the first schema
      fileMatch: QG_CONFIG_FILEMATCH, // associate with a model, enabled if it matches currentModelUri
      schema: QgConfigSchemaV0 as JSONSchema7,
    },
    {
      uri: `${PREFIX}/${QgConfigSchemaCommonV0['$id']}`,
      fileMatch: QG_CONFIG_FILEMATCH,
      schema: QgConfigSchemaCommonV0 as JSONSchema7,
    },
  ],
  v1: [
    {
      uri: `${PREFIX}/${QgConfigSchemaV1['$id']}`, // id of the first schema
      fileMatch: QG_CONFIG_FILEMATCH, // associate with a model, enabled if it matches currentModelUri
      schema: QgConfigSchemaV1 as JSONSchema7,
    },
  ],
} satisfies Record<MainConfigFileVersion, SchemasSettings[]>

const getMainFileVersion = (raw: string): 'v0' | 'v1' | undefined => {
  try {
    const content = load(raw) as { metadata?: { version: string } }
    if (content.metadata?.version === 'v1') return 'v1'
    if (!content.metadata) return 'v0'
    return undefined
  } catch (e) {
    return undefined
  }
}

const provideSchemasFromConfigContent = (raw: string): SchemasSettings[] => {
  // BUG (edge case): if the file has an error and the version is updated, then the schemas are not updated accordingly
  const version = getMainFileVersion(raw)
  return version ? STATIC_SCHEMAS[version] : []
}

type UseSchemasInYamlEditorParams = {
  areAvailable: MaybeRef<boolean>
  files: MaybeRef<EditorFile[]>
}
export const useSchemasInYamlEditor = (
  params: UseSchemasInYamlEditorParams,
) => {
  // TODO: optimization to avoid to trigger the computed and everything related every time a character changes in the files
  const schemas = computed(() => {
    if (!unref(params.areAvailable)) return []
    return unref(params.files).reduce((acc, file) => {
      // add IDE support for qg-config
      if (file.filename === MAIN_CONFIG_FILE) {
        acc.push(...provideSchemasFromConfigContent(file.content ?? ''))
      }
      // improve basic support with qg-config-schema if provided
      if (file.filename === MAIN_CONFIG_COMPLETION_FILE) {
        acc.push({
          fileMatch: [MAIN_CONFIG_FILE],
          schema: patchQgAnswersSchema(JSON.parse(file.content ?? '{}')),
          uri: MAIN_CONFIG_COMPLETION_FILE,
        })
      }
      return acc
    }, [] as SchemasSettings[])
  })

  return {
    schemas,
  }
}
