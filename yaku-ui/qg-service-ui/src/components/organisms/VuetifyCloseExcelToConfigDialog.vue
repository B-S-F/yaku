<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogDialog id="close-edit-config" open title="Unsaved changes" hide-close-btn is-modal type="info">
    <template #headline>
      Exit without creating the configuration?
    </template>
    <template #body>
      <p>The configuration won't be created.</p>
    </template>
    <template #actions>
      <FrogButton @click="emit('confirm')">
        OK
      </FrogButton>
      <FrogButton secondary @click="emit('abort')">
        Cancel
      </FrogButton>
    </template>
  </FrogDialog>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'abort'): void
}>()
</script>

<style scoped lang="scss">
#close-edit-config {
  width: 640px;
}
</style>
