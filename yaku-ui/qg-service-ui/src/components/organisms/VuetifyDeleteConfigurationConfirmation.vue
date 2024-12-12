<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground>
    <FrogDialog v-bind="$attrs" id="delete-configuration-dialog" :open="!!configName" title="Confirmation" type="info"
      @close="emit('cancel')">
      <template #headline>
        Delete Configuration
      </template>
      <template #body>
        Are you sure you want to delete the configuration "{{ configName }}"?
      </template>
      <template #actions>
        <FrogButton data-cy="confirm-button" @click="emit('confirm')">
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
  configName: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>
