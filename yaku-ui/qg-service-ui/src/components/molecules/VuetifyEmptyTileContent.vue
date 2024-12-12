<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="empty-tile">
    <div class="content">
      <FrogIcon class="icon" :class="type == 'info' ? 'text-info' : 'text-success'" :icon="icon" alt="" />
      <span>{{ label }}</span>
    </div>
    <svg viewBox="0 0 767 99" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- FIXME: hardcoded color -->
      <path
        d="M767 1.54005C719.385 -2.52055 664.968 0.913896 605.65 18.2911C513.832 45.1894 448.992 -13.6122 336.995 87.1272H767V1.54005Z"
        fill="#c1c7cc" />
      <!-- FIXME: hardcoded color -->
      <path
        d="M0 89.5967H719.909C719.909 89.5967 683.381 73.6395 624.022 73.6395C573.505 73.3671 520.313 79.2389 520.313 79.2389C497.131 69.6996 352.209 14.9662 153.719 48.7062C98.0472 58.1694 52.0628 49.777 0 53.7903V89.5967Z"
        fill="#c1c7cc" />
      <!-- FIXME: hardcoded color -->
      <path
        d="M766.999 71.0049C683.679 44.5915 623.389 67.5564 544.289 53.0098C337.939 15.0618 200.495 64.0995 176.395 74.8286C176.395 74.8286 108.502 74.3135 55.9851 74.6199C34.22 74.6199 15.3353 77.654 0 81.5804V99.0001H766.999V71.0049Z"
        fill="#e0e2e5" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type: 'info' | 'success'
  label: string
}>()

const icon = computed(() =>
  props.type === 'success'
    ? 'mdi-check-circle-outline'
    : 'mdi-information-outline',
)
</script>

<style scoped lang="scss">
.empty-tile {
  // for the absolute bottom positioned svg
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  // center the content
  transform: translateY(-50%);
}

.icon {
  font-size: 3rem;
}

svg {
  position: absolute;
  bottom: 0;
  margin-top: $space-component-s;
  width: 100%;
}
</style>
