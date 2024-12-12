<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <FrogDialog id="delete-finding-comment-dialog" open title="Confirmation" type="info" @close="emit('close')">
      <template #headline>
        Delete comment and unresolve
      </template>
      <template #body>
        Are you sure you want to delete the comment and unresolve the finding?
      </template>
      <template #actions>
        <FrogButton @click="emit('confirm')">
          Delete
        </FrogButton>
        <FrogButton secondary @click="emit('close')">
          Cancel
        </FrogButton>
      </template>
    </FrogDialog>
  </template>

  <script lang="ts" setup>
const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()
</script>
