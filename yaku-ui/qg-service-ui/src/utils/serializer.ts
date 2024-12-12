// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { UseStorageOptions } from '@vueuse/core'

export const JSONSerializer: UseStorageOptions<any>['serializer'] = {
  read: (v: any) => (v ? JSON.parse(v) : null),
  write: (v: any) => JSON.stringify(v),
}
