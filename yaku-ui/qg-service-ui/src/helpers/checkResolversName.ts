// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { NamespaceUser } from '~/api'
import { AUTOMATIC_RESOLVER_NAME } from '~/config/app'

export const isAutoResolved = (resolver: string | NamespaceUser | null) => {
  if ((typeof resolver as string) === 'string') {
    return (
      resolver?.toString().toLowerCase() ===
      AUTOMATIC_RESOLVER_NAME.toLowerCase()
    )
  }
  return false
}
