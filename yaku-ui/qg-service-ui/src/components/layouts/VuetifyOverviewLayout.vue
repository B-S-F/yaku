<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <main class="overview-layout" :class="{ 'empty-overview': emptyOverview }">
    <slot name="toolbar" />
    <slot name="filters" />

    <slot />
  </main>
</template>

<script setup lang="ts">
defineProps<{
  emptyOverview?: boolean
}>()
</script>

<style scoped lang="scss">
// Overwrite default layout
:global(#app #vuetify-view-layout > main.overview-layout) {
  grid-column: col-start 2 / span 10;
  max-width: 1680px;

  @media screen and (max-width: $bp-max-1210) {
    grid-column: col-start 1 / span 12;
  }
}

.overview-layout {
  display: grid;
  grid-template-rows: auto auto 1fr;
  row-gap: 28px;
  padding-top: $space-section;
  position: relative;
}

.empty-overview {
  display: block;
}
</style>
