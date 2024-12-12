<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <main class="span-6-center error-page">
    <VuetifyScreenCenter class="content">
      <component :is="errorPageContent.image" />

      <h1 class="text-h5 font-weight-bold">
        {{ ERRORS[type]?.title }}
      </h1>
      <p class="desc">
        {{ errorPageContent.desc }}
      </p>
      <div v-if="errorPageContent.reloadAction" class="a-link -icon">
        <RouterLink :to="previousRoute ?? DEFAULT_REDIRECT">
          <span>Reload</span>
          <FrogIcon icon="mdi-chevron-right" />
        </RouterLink>
      </div>
      <div v-if="errorPageContent.backToValidRoute" class="a-link -icon">
        <RouterLink :to="previousRoute ?? DEFAULT_REDIRECT">
          <span>Back to previous page</span>
          <FrogIcon icon="mdi-chevron-right" />
        </RouterLink>
      </div>
      <div v-if="errorPageContent.documentationLink" class="a-link -icon">
        <a :href="errorPageContent.documentationLink" target="_blank">
          <span>Read the prerequisites documentation</span>
          <FrogIcon icon="mdi-open-in-new" />
        </a>
      </div>
      <div v-if="errorPageContent.noPermissionError" class="switch-env w-25">
        <FrogDropdown id="server-switch" v-model="selectedServer" :items="serverOptions" label="Change environment"
          placeholder="Selecting..." />
        <FrogButton @click="onConfirm">
          OK
        </FrogButton>
      </div>
    </VuetifyScreenCenter>
  </main>
</template>

<script setup lang="ts">
import { SelectItem } from '@B-S-F/frog-vue'
import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import type { Component } from 'vue'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { RouteLocationNamedRaw, useRoute, useRouter } from 'vue-router'
import { useUrlContext } from '~/composables'
import useLastFunctionalRoute from '~/composables/useLastFunctionalRoute'
import { SWITCH_SERVER_FROM } from '~/constants/keycloak'
import VuetifyWorldMap from '~/icons/VuetifyWorldMap.vue' // static import as this illustration designates... offline connexion
import { ACTIVE_ENV_KEY } from '~/main'
import { ROUTE_NAMES } from '~/router'
import { switchEnvironment } from '~/router/utils'
import useEnvsStore from '~/store/useEnvsStore'
import type { ErrorPageType, RawEnvironment } from '~/types'
import VuetifyScreenCenter from '../layouts/VuetifyScreenCenter.vue'

type ErrorPage = {
  image: Component
  title: string
  desc: string
  noPermissionError?: boolean
  reloadAction?: boolean
  documentationLink?: string
  backToValidRoute?: boolean
}

const router = useRouter()
const route = useRoute()
const { urlContext } = useUrlContext()
const { lastFunctionalRoute } = useLastFunctionalRoute()

// try to navigate if the redirect_path is set
const redirect_path = route.query['redirect_path']?.toString()
if (redirect_path) {
  router.push(redirect_path)
}

// set the redirect_path
const DEFAULT_REDIRECT = computed<RouteLocationNamedRaw>(() => {
  if (urlContext.value.serverSlug && urlContext.value.namespaceSlug)
    return { name: ROUTE_NAMES.CONFIGS_OVERVIEW, params: urlContext.value }
  else return { path: '/' }
})
const previousRoute = (lastFunctionalRoute.value ??
  router.options.history.state.back) as string | undefined
if (previousRoute && !redirect_path) {
  router.replace({ query: { ...route.query, redirect_path: previousRoute } })
}

// For switching server
const environemtsStore = useEnvsStore()
const { environments, fallbackEnvironment } = storeToRefs(environemtsStore)
onMounted(async () => await environemtsStore.getEnvironments())
const serverOptions = computed(() =>
  environments.value.map((s) => {
    return {
      label: s.label,
      value: s.slug,
    }
  }),
)

const fallbackOption = computed(() =>
  fallbackEnvironment
    ? serverOptions.value.find((s) => s.value === fallbackEnvironment.value)
    : serverOptions.value[0],
)
const selectedServer = ref<SelectItem | undefined>(fallbackOption.value)
const switchKeycloakFrom = useLocalStorage<string | undefined>(
  SWITCH_SERVER_FROM,
  undefined,
)

const onConfirm = () => {
  if (!selectedServer.value) return
  const serverSlug = selectedServer.value
  const matchingEnv = environments.value.find(
    ({ slug }) => slug === serverSlug.value,
  ) as RawEnvironment | undefined
  if (matchingEnv) {
    localStorage.setItem(ACTIVE_ENV_KEY, JSON.stringify(matchingEnv))
    switchEnvironment(router, matchingEnv?.slug, switchKeycloakFrom.value)
  }
}

const type = route.query['type'] as ErrorPageType
const ERRORS: Record<ErrorPageType, ErrorPage> = {
  'no-network': {
    image: VuetifyWorldMap,
    title: 'No Connection',
    desc: 'The page you are looking for could not be found.\nCheck the internet connection OR try to reload the page.',
    reloadAction: true,
  },
  'not-found': {
    image: VuetifyWorldMap,
    title: 'Not Found',
    desc: 'The page you are looking for could not be found.\nThe resource could not exist.',
    backToValidRoute: true,
  },
  'no-permission': {
    image: defineAsyncComponent(
      () => import('~/icons/VuetifyDoorLockClosed.vue'),
    ),
    title: 'Missing permissions',
    desc: 'You do not have access to the account, property or view.\nContact an administrator who has the manage user permission.',
    noPermissionError: true,
  },
  'no-env': {
    image: defineAsyncComponent(
      () => import('~/icons/VuetifyDoorLockClosed.vue'),
    ),
    title: 'Missing permissions',
    desc: 'You do not have access to a namespace.\nContact a namespace administrator so you can get required permissions in the namespace.',
    documentationLink:
      'https://cuddly-adventure-1991k8p.pages.github.io/quickstart.html',
  },
} as const

const errorPageContent = computed(() =>
  ERRORS[type] ? ERRORS[type] : ERRORS['not-found'],
)
</script>

<style scoped lang="scss">
@use '../../styles/tokens.scss' as *;

.error-page {
  &>div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}

.image,
.error-page {
  .content {
    :deep(svg) {
      max-height: 30vh;
    }
  }
}

.desc {
  text-align: center;
  white-space: pre;
}

.switch-env {
  margin-top: $spacing-16;
  text-align: center;

  .v-select {
    margin-bottom: $spacing-16;
  }
}
</style>
