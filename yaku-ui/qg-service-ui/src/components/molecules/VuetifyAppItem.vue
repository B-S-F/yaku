<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogButton class="app-item bg-background" tertiary :class="{ 'selected': selected }">
    <VuetifyAppIcon class="text-body-1 font-weight-bold" :name="name" />
    <span class="name">{{ name }}</span>
  </FrogButton>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  selected?: boolean
}>()
</script>

<style scoped lang="scss">
// TODO: Fix colors
.app-item {
  width: 100%;

  :deep(.v-button__label) {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: $space-component-m;
    width: 100%;
  }
}

.name {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
