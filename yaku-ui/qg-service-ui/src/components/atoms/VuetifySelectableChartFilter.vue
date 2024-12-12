<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogButton ref="nodeRef" class="selectable-filter" :class="{ selected: selected }" :disabled="disabled" integrated>
    <FrogIcon class="action-icon text-body-2" :icon="selected ? 'mdi-close-small' : 'mdi-filter-outline'" />
    <slot />
  </FrogButton>
</template>

<script setup lang="ts">
defineProps<{
  disabled?: boolean
  selected?: boolean
}>()
</script>

<style scoped lang="scss">
.selectable-filter {
  background-color: transparent;
  color: #C1C7CC;
  padding: 0;
  min-width: 0;

  // height: 100% !important;
  &:not([disabled]):not(.selected) {

    &:hover,
    &:focus-visible {
      background-color: #C1C7CC;

      .-dark-mode & {
        background-color: #2E3033;
      }

      .action-icon {
        visibility: visible;
      }
    }
  }

  :deep(.v-btn__content) {
    line-height: 1;
    margin: 0;
  }
}

.selected,
.selected:hover,
.selected:focus {
  background-color: #C1C7CC;

  .action-icon {
    visibility: visible;
  }
}

.action-icon {
  font-size: 1rem;
  line-height: 1;
  visibility: hidden;
}
</style>
