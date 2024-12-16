// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { useSessionStorage } from '@vueuse/core'
import { NavigationHookAfter } from 'vue-router'

const useLastFunctionalRoute = () => {
  const lastFunctionalRoute = useSessionStorage<string | undefined>(
    'last-functional-route',
    undefined,
  )
  const recordFunctionalRoute: NavigationHookAfter = (to, from) => {
    if (from.name === undefined) return
    if (!from.meta.isErrorView && !to.meta.isErrorView)
      lastFunctionalRoute.value = from.path
  }

  return {
    recordFunctionalRoute,
    lastFunctionalRoute,
  }
}

export default useLastFunctionalRoute
