<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { currentNamespace } from '~api'
import { usePageTitle } from '~composables'
import { keycloakService } from './auth/KeycloakService'
import { USER_HAS_SEEN_SIDEBAR } from './constants/storage'
import useEnvsStore from './store/useEnvsStore'
import useKeycloakStore from './store/useKeycloakStore'
import useUserProfileStore from './store/useUserProfileStore'
import { RawEnvironment } from './types'

const isLoading = ref(true)
const route = useRoute()
usePageTitle()
const environmentStore = useEnvsStore()
const { environments } = storeToRefs(environmentStore)
const profileStore = useUserProfileStore()
const keycloakInstance = keycloakService.getKeycloakInstance()

onMounted(async () => {
  isLoading.value = false
  await environmentStore.getEnvironments()
  /** Check User Profile */
  if (keycloakInstance) await profileStore.loadProfile()
})
const isSidebarOpen = ref(!localStorage.getItem(USER_HAS_SEEN_SIDEBAR))
// set the class on the #app level so dialogs and banner can get access to globally set variables
watchEffect(() => {
  if (isSidebarOpen.value) {
    document.querySelector('#app')?.classList.add('-sidebar-open')
  } else {
    document.querySelector('#app')?.classList.remove('-sidebar-open')
  }
})

const keycloakStore = useKeycloakStore()
// TODO: Adjust to service
useIntervalFn(() => {
  if (import.meta.env.MODE !== 'dev:mock') {
    if (keycloakInstance && keycloakStore.authenticated)
      keycloakStore.updateToken(() => keycloakStore.load(keycloakInstance))
  }
}, 5000)

const handleSideNavOpen = (evt: boolean) => {
  if (!localStorage.getItem(USER_HAS_SEEN_SIDEBAR))
    localStorage.setItem(USER_HAS_SEEN_SIDEBAR, 'true')
  isSidebarOpen.value = evt
}
</script>

<template>
  <v-app>
    <VuetifyHeader v-if="!route.meta.isExtraView && !route.meta.isPrintView && route.meta.authRequired"
      :environments="environments as unknown as RawEnvironment[]" />
    <v-main>
      <router-view
        v-if="route.meta.isErrorView || route.meta.isExtraView || !route.meta.authRequired || route.meta.isPrintView" />
      <VuetifyMain v-else-if="!isLoading && currentNamespace" :class="{ '-sidebar-open': isSidebarOpen }" />
      <main v-else-if="isLoading" class="main-view loading-page-placeholder"
        :class="{ '-sidebar-open': isSidebarOpen }">
        <FrogActivityIndicator type="large" />
      </main>
    </v-main>
  </v-app>
</template>

<style scoped lang="scss">
@use './styles/tokens.scss' as *;

.loading-page-placeholder {
  display: grid;
  place-content: center;
  height: calc(100vh - 108px);
  width: var(--view-width);
}
</style>
