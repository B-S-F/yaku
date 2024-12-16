<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogDialog id="delete-file-dialog" :open="showDialog" title="Confirmation" type="info" @close="emit('close')">
    <template #headline>
      Delete Configuration file
    </template>
    <template #body>
      Are you sure you want to delete the file "{{ filename }}" from your private namespace?
    </template>
    <template #actions>
      <FrogButton data-cy="confirm-delete-button" @click="emit('confirm')">
        Delete
      </FrogButton>
      <FrogButton secondary @click="emit('close')">
        Cancel
      </FrogButton>
    </template>
  </FrogDialog>
</template>

<script lang="ts" setup>
defineProps<{
  filename: string
  showDialog: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()
</script>
