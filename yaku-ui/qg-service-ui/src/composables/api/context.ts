// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { RawEnvironment } from '~/types'
import type { Namespace } from '~/api'
import { computed, ref } from 'vue'

/** shared value between all Yaku APIs */
export const currentEnv = ref<RawEnvironment>()
/** shared value between all Yaku APIs */
export const currentNamespace = ref<Namespace>()

export type StoreContext = typeof storeContext
export const storeContext = computed(() => ({
  serverId: currentEnv.value!.slug,
  namespaceId: currentNamespace.value!.id,
}))
