// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { AvailableEnvironment, Environment } from '~/types'
import type { Namespace } from '~/api'
import type { Ref } from 'vue'
import { toRef, watch } from 'vue'
import { slugify } from '~/utils'

type LastEnvironmentSlugs = {
  serverSlug: Environment['slug']
  namespaceSlug: string
}

export const STORAGE_KEY = 'last-environment-used'

// localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY) as string) : undefined
const lastEnvironmentUsed = toRef<LastEnvironmentSlugs>(
  localStorage.getItem(STORAGE_KEY)
    ? JSON.parse(localStorage.getItem(STORAGE_KEY) as string)
    : undefined,
)

type UseLastEnvironmentUsedParams = {
  currentEnv: Ref<Pick<AvailableEnvironment, 'slug'> | undefined>
  namespace: Ref<Pick<Namespace, 'name'> | undefined>
}
export const useLastEnvironmentUsed = ({
  currentEnv,
  namespace,
}: UseLastEnvironmentUsedParams) => {
  /** update the last environment used on changes */
  watch([currentEnv, namespace], ([newEnv, newNamespace]) => {
    const serverSlug = newEnv?.slug
    const namespaceSlug = newNamespace
      ? slugify(newNamespace?.name ?? '')
      : slugify(lastEnvironmentUsed.value.namespaceSlug ?? '')
    if (!serverSlug || !namespace) return

    lastEnvironmentUsed.value = {
      serverSlug,
      namespaceSlug,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(lastEnvironmentUsed.value))
  })

  return {
    lastEnvironmentUsed,
  }
}
