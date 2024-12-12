// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { slugify } from '~/utils'

/**
 * It provides URL server and namespace slugs for the App and returns helper functions with it.
 */
export const useUrlContext = () => {
  const route = useRoute()

  const urlContext = computed(() => {
    const { serverSlug, namespaceSlug } = route.params
    // if the optional serverSlug is undefined, then we switch its value with the namespace slug
    // because the router serverSlug is optional
    if (!serverSlug) {
      return {
        serverSlug: namespaceSlug as string,
        namespaceSlug: undefined,
      }
    } else {
      return {
        serverSlug: serverSlug as string,
        namespaceSlug: namespaceSlug ? (namespaceSlug as string) : undefined,
      }
    }
  })

  const envPathPrefix = computed(() => {
    const { serverSlug, namespaceSlug } = urlContext.value
    if (serverSlug && namespaceSlug) return `/${serverSlug}/${namespaceSlug}`
    return undefined
  })

  return {
    urlContext,
    slugify,
    envPathPrefix,
  }
}
