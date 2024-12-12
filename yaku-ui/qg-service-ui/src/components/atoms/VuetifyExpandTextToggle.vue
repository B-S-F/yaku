<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogButton class="link" tertiary @click="emit('update:modelValue', !modelValue)">
    <span class="a-button__label">
      <span :class="{ 'hidden': modelValue }">Show More</span>
      <span :class="{ 'hidden': !modelValue }">Show Less</span>
    </span>
    <FrogIcon :icon="modelValue ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
  </FrogButton>
</template>

<script setup lang="ts">
import FrogButton from '@B-S-F/frog-vue/src/atoms/FrogButton.vue'
import FrogIcon from '@B-S-F/frog-vue/src/atoms/FrogIcon.vue'
defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<(e: 'update:modelValue', newVal: boolean) => void>()
</script>

<style scoped lang="scss">
.hidden {
  visibility: hidden;
}

.v-btn {
  :deep(span.v-btn__content) {
    display: flex;
  }
}

.link {
  :deep(.v-btn__content) {
    padding-top: 0;
    padding-bottom: 0;
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    column-gap: 8px;

    & span {
      grid-area: 1 / 1 / 2 / 2;
    }
  }
}
</style>
