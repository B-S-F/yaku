// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Ref } from 'vue'
import type { RawEnvironment } from '~/types'
import { reactiveComputed } from '@vueuse/core'
import { computed } from 'vue'

const UI_PRODUCTION_VERSION = 'portal'

// export for testing purposes
export const getUiVersion = (hostname: string) => {
  const firstDomainPart = hostname.split('.')[0]
  const lastPart = firstDomainPart.split('-').at(-1)
  return lastPart
}

export const useDevBanner = (environment: Ref<RawEnvironment | undefined>) => {
  /** provide ui version when it is not production */
  const ui = computed(() => {
    const uiName = getUiVersion(window.location.hostname)
    return uiName !== UI_PRODUCTION_VERSION ? uiName : undefined
  })

  /** provide the api label when it is not production */
  const api = computed(() => {
    const env = environment.value
    return !env || env.slug.includes('production') ? undefined : env.label
  })

  const bannerProps = reactiveComputed(() => ({ ui, api }))

  return {
    bannerProps,
  }
}
