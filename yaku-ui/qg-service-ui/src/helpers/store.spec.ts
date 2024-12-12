// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { computed } from 'vue'
import { getStoreKey } from './store'

describe('getStoreKey', () => {
  it('returns the appropriate key format', () => {
    const storeContext = computed(() => ({
      serverId: 'serverSlug',
      namespaceId: 1,
    }))
    expect(getStoreKey('storeName', storeContext)).toStrictEqual(
      'storeName-serverSlug-1',
    )
  })
})
