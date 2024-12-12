<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyScreenCenter>
    <FrogDialog id="close-edit-config" open hide-close-btn is-modal type="info" title="Unsaved changes">
      <template #headline>
        Close without saving?
      </template>
      <template #body>
        <p>The configuration contains unsaved changes, which can be saved or discarded before closing the editor.</p>
      </template>
      <template #actions>
        <FrogButton secondary @click="emit('close')">
          Return to Editor
        </FrogButton>
        <FrogButton @click="emit('confirm')">
          Save & Close
        </FrogButton>
        <FrogButton secondary @click="emit('abort')">
          Discard & Close
        </FrogButton>
      </template>
    </FrogDialog>
  </VuetifyScreenCenter>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
  (e: 'abort'): void
}>()
</script>

<style scoped lang="scss">
#close-edit-config {
  width: 640px;
}
</style>
