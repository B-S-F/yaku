// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { currentEnv, currentNamespace } from '~/composables/api'
import type { Router } from 'vue-router'
import { SWITCH_SERVER_FROM } from '~/constants/keycloak'
import { ROUTE_NAMES } from './routes'
export const loadMockTestEnvs = () => {
  // this value is written in cypress interceptions
  const activeMockEnv = localStorage.getItem('cy_current_env')
  if (activeMockEnv && typeof activeMockEnv === 'string') {
    currentEnv.value = JSON.parse(activeMockEnv)
  }
  if (currentEnv.value?.namespaces) {
    currentNamespace.value = currentEnv.value.namespaces[0]
  }
}

export const switchEnvironment = (
  router: Router,
  serverSlug: string,
  currentView?: string,
) => {
  if (currentView) localStorage.setItem(SWITCH_SERVER_FROM, currentView)
  router.push({ path: `/${serverSlug}` })
}

export const getAllRoutes = (): string[] =>
  Object.values(ROUTE_NAMES).map((r) => r.toString())

export const decodePathComponent = (component?: string) => {
  if (!component) return undefined
  return decodeURIComponent(String(component))
}
