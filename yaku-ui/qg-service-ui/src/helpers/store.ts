// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { unref } from 'vue'
import { StoreContext } from '~api'

export const getStoreKey = (name: string, context: StoreContext) => {
  const { serverId, namespaceId } = unref(context)
  return `${name}-${serverId}-${namespaceId}` as const
}
