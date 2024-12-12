<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <span class="delta-pill" :class="theme.background">
    <FrogIcon :icon="theme.icon" />
    <span>{{ Math.abs(delta) }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  delta: number
}>()

const theme = computed(() => {
  if (props.delta > 0) {
    return {
      background: 'bg-error',
      icon: 'mdi-arrow-up-thin-circle-outline',
    }
  } else if (props.delta < 0) {
    return {
      background: 'bg-success',
      icon: 'mdi-arrow-down-thin-circle-outline',
    }
  } else {
    return {
      background: 'bg-info',
      icon: 'mdi-arrow-right-thin-circle-outline',
    }
  }
})
</script>

<style scoped lang="scss">
.delta-pill {
  display: flex;
  align-items: center;
  column-gap: $space-chip;
  width: fit-content;

  padding: $padding-component-xxs $padding-component-m $padding-component-xxs $padding-component-xxs;
  border-radius: 16px;
}
</style>
