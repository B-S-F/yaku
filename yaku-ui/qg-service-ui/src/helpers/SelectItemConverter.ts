// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Namespace } from '~/api'
import type { Config, Environment, SelectItem, SecretMetadata } from '~/types'
import type { EditorFile, ID } from '~/composables/useEditorFiles'
import { slugify } from '~utils'

export const SelectItemConverter = {
  // generic converters
  fromNumber: <T extends string | number>(id: T): SelectItem<T> => ({
    value: id,
    label: id.toString(),
  }),
  fromString: (id: string) => ({ value: id, label: id }),

  // specific converters
  fromEnv: ({ label, slug }: Environment): SelectItem<Environment['slug']> => ({
    value: slug,
    label,
  }),
  fromNamespace: ({ name }: Namespace): SelectItem<string> => ({
    value: slugify(name),
    label: name,
  }),
  fromEditorFile: ({ id, filename }: EditorFile): SelectItem<ID> => ({
    value: id,
    label: filename,
  }),
  fromSecret: (s: SecretMetadata): SelectItem<string> => ({
    value: s.name,
    label: s.name,
  }),
  fromConfig: (c: Config): SelectItem<Config['id']> => ({
    value: c.id,
    label: c.name,
  }),
}
