<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground class="processing-action">
    <FrogProgressIndicator :max="100" isIndeterminate />
    <p class="text-lg-body-1 font-weight-bold	">
      {{ label }}
    </p>
  </VuetifyBlurBackground>
</template>

<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<style scoped lang="scss">
.processing-action {
  display: flex;
  flex-flow: column nowrap;
  row-gap: max(32px, 4.5vh);

  &>* {
    margin: 0;
  }
}
</style>
