// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { createApp } from 'vue'
import { router } from '~/router'
import { pinia } from './pinia.setup'

import App from './App.vue'

// import frok components
import {
  addMdiIcons,
  installFrokComponents,
  installVuetify,
} from '@B-S-F/frog-vue'

if (import.meta.env.VITE_TEST_VUETIFY_UI === 'true') {
  // @ts-expect-error NOTE: imports css
  import('vuetify/styles')
  addMdiIcons()
}

window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

// The environment the user is currently connected to
export const ACTIVE_ENV_KEY = 'active-environment-config'
// Keycloak instance available
export const KEYCLOAK_INSTANCE_STORAGE_KEY = 'keycloak-instance'
// keycloak Realm connect error
export const KEYCLOAK_CONNECT_ERROR = 'keycloak-connect-error'

export const IS_TEST_ENV = import.meta.env.MODE === 'dev:mock'

const app = createApp(App)

app.use(pinia)
// Load the router
app.use(router)
// register all frok components
app.use(installFrokComponents)
if (import.meta.env.VITE_TEST_VUETIFY_UI === 'true') app.use(installVuetify)
// Mount the application only when the router is ready
router.isReady().then(() => {
  app.mount('#app')
})
