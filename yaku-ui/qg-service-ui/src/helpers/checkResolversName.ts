// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { NamespaceUser } from '~/api'
import { AUTOMATIC_RESOLVER_ID } from '~/config/app'

export const isAutoResolved = (resolver: NamespaceUser | null) => {
  if (resolver) {
    return (
      resolver.id?.toString().toLowerCase() ===
      AUTOMATIC_RESOLVER_ID.toLowerCase()
    )
  }
  return false
}
