<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <component :is="tag ?? 'div'" class="stack">
    <slot visibleClass="visible-on-stack" />
  </component>
</template>

<script setup lang="ts">
defineProps<{
  tag?: string
}>()
</script>

<style scoped lang="scss">
.stack {
  display: grid;

  >:slotted(*) {
    grid-area: 1 / 1 / 2 / 2;
    visibility: hidden;
  }

  &:slotted(> .visible-on-stack) {
    visibility: visible;
  }
}
</style>
