// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { MaybeRef } from '@vueuse/core'
import { type SchemasSettings, configureMonacoYaml } from 'monaco-yaml'
import { isRef, unref, watch } from 'vue'

export type UseMonacoYamlParams = {
  monacoEditor: typeof import('monaco-editor')
  schemas: MaybeRef<SchemasSettings[]>
}
export const useMonacoYaml = (params: UseMonacoYamlParams) => {
  const { monacoEditor, schemas } = params

  const monacoYaml = configureMonacoYaml(monacoEditor, {
    hover: true,
    completion: true,
    validate: true,
    format: true,
    schemas: unref(schemas) ?? [],
  })

  if (isRef(schemas)) {
    watch(schemas, (newSchemas, oldSchemas) => {
      if (newSchemas.length === (oldSchemas ?? []).length) return
      monacoYaml.update({
        schemas: newSchemas,
      })
    })
  }

  return {
    refresh: () => {
      monacoYaml.update({ schemas: unref(schemas) })
    },
  }
}
