<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div id="vuetify-view-layout"
    :class="{ 'bg-grey': route.name !== ROUTE_NAMES.EXCEL_TO_CONFIG && !route.meta.isErrorView }">
    <router-view />
    <Teleport v-if="isOnboardingActive" to="#app">
      <VuetifyOnboardingOverlay />
    </Teleport>
  </div>

</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE_NAMES } from '~/router'
import { useIsOnboardingActive } from '~/composables/onboarding/useIsOnboardingActive'
import { currentEnv } from '~/composables/api/context'
import { useDevBanner } from '~/composables'

/**
 * At this component level, the server and namespace (also the environment)
 * is defined and usable for the user.
 */
const route = useRoute()

const { isActive: isOnboardingActive } = useIsOnboardingActive()
const VuetifyOnboardingOverlay = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyOnboardingOverlay.vue'),
)
</script>

<style scoped lang="scss"></style>
