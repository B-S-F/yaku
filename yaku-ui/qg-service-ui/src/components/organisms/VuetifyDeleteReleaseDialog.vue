<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground>
    <FrogDialog id="delete-file-dialog" :open="!!name" title="Confirmation" type="info" @close="emit('cancel')">
      <template #headline>
        Delete the release
      </template>
      <template #body>
        Are you sure you want to delete the release "{{ name }}"?
      </template>
      <template #actions>
        <FrogButton data-cy="confirm-delete-button" @click="emit('confirm')">
          Delete
        </FrogButton>
        <FrogButton secondary @click="emit('cancel')">
          Cancel
        </FrogButton>
      </template>
    </FrogDialog>
  </VuetifyBlurBackground>
</template>

<script lang="ts" setup>
defineProps<{
  name: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>
