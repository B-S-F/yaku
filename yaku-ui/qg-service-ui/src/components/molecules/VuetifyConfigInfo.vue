<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <span class="config-info">
    <FrogIcon class="icon" :icon="icon" />
    <span v-if="label" class="label">{{ label
      }}</span>
    <span>{{ value }}</span>
  </span>
</template>

<script setup lang="ts">
/**
 * This component is meant to be used in the config list item
 */
defineProps<{
  icon: string
  label?: string
  value: string | number
}>()
</script>

<style scoped lang="scss">
.config-info {
  display: flex;
  column-gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
  font-size: 14px;
  line-height: 18px;
}

:global(a .config-info:last-of-type:not(:first-of-type)) {
  display: flex;
}

.label {
  font-weight: 700;
}

.icon {
  font-size: $size-icon-s;
  margin: 0;
}
</style>
