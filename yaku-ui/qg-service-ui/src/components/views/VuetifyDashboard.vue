<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <main class="dashboard-layout">
    <div class="onboarding-element-without-focus top-80" data-onboarding="dashboard" />
    <h2 v-if="keycloakStore.user" class="heading text-h6 font-weight-bold" :class="{ 'ma-0': isBannerHidden }">
      Hello {{ keycloakStore.user.firstName }}!
    </h2>
    <VuetifyPerformanceTile class="all-col" :configItems="configItems" data-onboarding="performance" />
    <VuetifyLastOpenedTile class="first-col" data-onboarding="last-opened-tile" />
    <VuetifyMostFindingsTile class="last-col" data-onboarding="most-findings" />
    <VuetifyMostDecreasedQualityTile class="first-col" data-onboarding="most-decreased" />
    <VuetifyMostIncreasedQualityTile class="last-col" data-onboarding="most-increased" />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GetConfigs } from '~/api'
import { currentEnv, storeContext, useApiCore } from '~/composables/api'
import { SelectItemConverter } from '~/helpers'
import { useConfigStore } from '~/store/useConfigStore'
import useKeycloakStore from '~/store/useKeycloakStore'
import { useDevBanner } from '~composables'

const apiCore = useApiCore()
const configStore = useConfigStore(storeContext)
const keycloakStore = useKeycloakStore()
const { bannerProps } = useDevBanner(currentEnv)
const isBannerHidden = computed(() => !(bannerProps.ui || bannerProps.api))
const gridRowHeight = computed(() => (isBannerHidden.value ? '12px' : '24px'))

apiCore.getConfigs({ sortBy: 'lastModificationTime' }).then(async (r) => {
  if (r.ok) {
    const { data } = (await r.json()) as GetConfigs
    configStore.push(data)
  }
})
const configItems = computed(() =>
  configStore.configs
    .map(SelectItemConverter.fromConfig)
    .sort((a, b) => a.label.localeCompare(b.label)),
)
</script>

<style scoped lang="scss">
@use "../../styles/tokens.scss" as *;

// Overwrite default layout
// Similar to the overview layout
:global(#app #vuetify-view-layout) {
  grid-template-rows: max-content !important;
  height: 100%;
  overflow-y: auto !important;
}

:global(#app #vuetify-view-layout > main.dashboard-layout:first-of-type) {
  grid-column: col-start 2 / span 10;
  max-width: 1680px;
  padding-top: $space-section;

  width: 100%;
  margin: auto;

  @media screen and (max-width: $bp-max-820) {
    grid-column: col-start 1 / span 12;
  }
}

.dashboard-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-component-xl 0;
  grid-template-rows: v-bind(gridRowHeight) auto !important;

  >* {
    height: 100%;
  }

  --one-col-layout: 1 / -1;

  .all-col {
    grid-column: var(--all-col, var(--one-col-layout));
  }

  .first-col {
    grid-column: var(--first-col, var(--one-col-layout));
  }

  .last-col {
    grid-column: var(--last-col, var(--one-col-layout));
  }
}

@media screen and (max-width: 1200px) {
  :global(#app #vuetify-view-layout > main.dashboard-layout:first-of-type) {
    height: 100%;
    padding-bottom: #{2 * $space-component-xl};
  }
}

@media screen and (min-width: 1200px) {
  .dashboard-layout {
    gap: $space-section;
    grid-template-rows: repeat(auto-fit, minmax(320px, 1fr));
    overflow: auto;
    --all-col: 1 / -1;
    --first-col: 1 / 2;
    --last-col: -2 / -1;
  }
}

.-no-margin {
  margin: 0;
}
</style>
