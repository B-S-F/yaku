<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground>
    <FrogDialog v-bind="$attrs" id="delete-run-dialog" :open="!!secretName" title="Confirmation" type="info">
      <template #headline>
        Delete Secret
      </template>
      <template #body>
        Are you sure you want to delete the secret "{{ secretName }}"?
      </template>
      <template #actions>
        <FrogButton data-cy="delete-confirmation-button" @click="emit('confirm')">
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
  secretName: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>
