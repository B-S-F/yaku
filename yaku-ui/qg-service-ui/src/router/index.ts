// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { createRouter, createWebHistory } from 'vue-router'
import { routes, ROUTE_NAMES } from './routes'
import { currentEnv, currentNamespace } from '~/composables/api'
import useLastFunctionalRoute from '~/composables/useLastFunctionalRoute'
import { keycloakService } from '~/auth/KeycloakService'
import useKeycloakStore from '~/store/useKeycloakStore'
import { decodePathComponent, getAllRoutes, loadMockTestEnvs } from './utils'
import { SWITCH_SERVER_FROM } from '~/constants/keycloak'

export const router = createRouter({
  // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
  history: createWebHistory(),
  routes, // short for `routes: routes`
})
const { recordFunctionalRoute } = useLastFunctionalRoute()

export const ENV_HAS_CHANGED_KEY = 'env_changed'

router.beforeEach(async (to) => {
  let serverSlug = decodePathComponent(to.params?.serverSlug as string)
  const namespace = decodePathComponent(to.params?.namespaceSlug as string)
  const keycloakStore = useKeycloakStore()

  if (import.meta.env.MODE === 'dev:mock') {
    loadMockTestEnvs()
    return
  }

  if (!to.meta.authRequired && to.path !== '/') {
    return
  }

  if (to.path === '/' || !serverSlug) {
    const lastInitServer = localStorage.getItem('keycloak-last-init-server')
    if (!lastInitServer) return
    serverSlug = lastInitServer
  }

  if (serverSlug !== keycloakService.getCurrentRealm()) {
    try {
      await keycloakService.init(
        serverSlug,
        `${window.location.origin}${to.path}${window.location.search}`,
      )
    } catch (error) {
      console.error(`ROUTER: Failed to initialize realm ${serverSlug}`, error)
      return {
        name: 'ServerError',
        query: {
          type: 'no-permission',
        },
      }
    }
  }

  if (!keycloakService.isAuthenticated()) {
    try {
      await keycloakService.login(
        `${window.location.origin}${to.path}${window.location.search}`,
      )
    } catch (error) {
      console.error(`ROUTER: Failed to login ${serverSlug}`, error)
      return {
        name: 'ServerError',
        query: {
          type: 'no-permission',
        },
      }
    }
  }

  try {
    keycloakStore.load(keycloakService.getKeycloakInstance())
    await keycloakService.loadUserNamespaces()
    const targetNamespace = keycloakService
      .getUserNamespaces()
      .find((n) => n.name === namespace)
    currentEnv.value = keycloakService
      .getRealms()
      .find((env) => env.slug === serverSlug)
    if (currentEnv.value)
      currentEnv.value.namespaces = keycloakService.getUserNamespaces()
    currentNamespace.value =
      targetNamespace ?? keycloakService.getUserNamespaces()[0]
    if (!namespace) {
      const lastView = localStorage.getItem(SWITCH_SERVER_FROM)
      const routeExists = lastView && getAllRoutes().includes(lastView)
      return {
        name: routeExists ? lastView : ROUTE_NAMES.CONFIGS_OVERVIEW,
        params: {
          serverSlug,
          namespaceSlug: currentNamespace.value.name,
        },
      }
    } else if (!targetNamespace) {
      throw new Error('Namespace does not exist')
    }
    return
  } catch (error) {
    return {
      name: 'ServerError',
      query: {
        type: 'no-permission',
      },
    }
  }
})

// Records the last functional route in the localstorage
router.afterEach(recordFunctionalRoute)

export { ROUTE_NAMES }
